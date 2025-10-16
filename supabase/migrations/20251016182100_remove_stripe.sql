/*
  # Remove Stripe Integration

  1. Removes
    - Drop all Stripe-related views
    - Drop all Stripe-related tables
    - Drop Stripe-related enum types
    - Drop Stripe-related functions
    - Remove Stripe subscription check from user creation

  2. Security
    - All removals are done safely with IF EXISTS
    - No data loss concerns as Stripe is being completely removed
*/

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS stripe_user_orders CASCADE;
DROP VIEW IF EXISTS stripe_user_subscriptions CASCADE;

-- Drop tables (order matters due to dependencies)
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS stripe_order_status CASCADE;
DROP TYPE IF EXISTS stripe_subscription_status CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.user_has_active_subscription(uuid) CASCADE;

-- Update handle_new_user function to remove Stripe references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_id uuid;
  profile_exists boolean;
BEGIN
  -- Check if profile already exists to prevent duplicate creation
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = new.id
  ) INTO profile_exists;

  -- Only proceed if profile doesn't exist
  IF NOT profile_exists THEN
    -- Create organization with proper error handling
    BEGIN
      INSERT INTO public.organizations (
        name,
        slug,
        settings,
        subscription_tier,
        subscription_status
      )
      VALUES (
        COALESCE(new.raw_user_meta_data->>'organization_name', 'Minha Empresa'),
        COALESCE(
          lower(regexp_replace(new.raw_user_meta_data->>'organization_name', '[^a-zA-Z0-9]', '-', 'g')),
          'empresa'
        ) || '-' || extract(epoch from now())::text,
        jsonb_build_object(
          'general', jsonb_build_object(
            'company_name', COALESCE(new.raw_user_meta_data->>'organization_name', 'Minha Empresa'),
            'timezone', 'America/Sao_Paulo',
            'language', 'pt-BR'
          )
        ),
        'free',
        'active'
      )
      RETURNING id INTO org_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create organization for user %: %', new.id, SQLERRM;
        -- Create a fallback organization
        INSERT INTO public.organizations (
          name,
          slug,
          subscription_tier,
          subscription_status
        )
        VALUES (
          'Empresa ' || substr(new.id::text, 1, 8),
          'empresa-' || extract(epoch from now())::text,
          'free',
          'active'
        )
        RETURNING id INTO org_id;
    END;

    -- Create profile with proper error handling
    BEGIN
      INSERT INTO public.profiles (
        user_id,
        organization_id,
        email,
        full_name,
        role,
        settings
      )
      VALUES (
        new.id,
        org_id,
        new.email,
        COALESCE(
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'organization_name',
          split_part(new.email, '@', 1)
        ),
        'admin',
        jsonb_build_object(
          'general', jsonb_build_object(
            'company_name', COALESCE(new.raw_user_meta_data->>'organization_name', 'Minha Empresa'),
            'timezone', 'America/Sao_Paulo',
            'language', 'pt-BR'
          ),
          'notifications', jsonb_build_object(
            'new_messages', true,
            'system_alerts', true,
            'weekly_reports', false,
            'email_notifications', true
          ),
          'appearance', jsonb_build_object(
            'theme', 'auto',
            'language', 'pt-BR',
            'compact_mode', false
          ),
          'security', jsonb_build_object(
            'two_factor_enabled', false,
            'session_timeout', 30,
            'password_requirements', jsonb_build_object(
              'min_length', 8,
              'require_uppercase', true,
              'require_numbers', true,
              'require_symbols', true
            )
          ),
          'ai_models', jsonb_build_object(
            'selected_model', 'gpt-4o',
            'model_config', '{}'
          )
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Profile already exists for user %, skipping creation', new.id;
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Unexpected error in handle_new_user for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
