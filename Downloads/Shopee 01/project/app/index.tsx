import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Image, Modal, Pressable, Linking } from 'react-native';
import { ArrowLeft, ShoppingCart, MoveVertical as MoreVertical, Heart, Truck, ChevronRight, Star, ChevronUp, ChevronDown, MessageCircle, Play, CircleCheck as CheckCircle, X, ThumbsUp } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { useCallback } from 'react';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getSessionId = () => {
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }
  return 'default-session';
};

const FLAVORS = ['Morango', 'Melancia', 'Maçã Verde'];

const PRODUCT_IMAGES = [
  require('@/assets/images/br-11134207-81z1k-mgcf9ald0pvrcd.webp'),
  require('@/assets/images/br-11134207-81z1k-mgcf9alczbbb80.webp'),
  require('@/assets/images/br-11134207-81z1k-mgcf9ald3j0n54.webp'),
  require('@/assets/images/br-11134207-7r98o-m2ba0e8a58w6ec.webp'),
];

const PRODUCT_VIDEO = 'https://down-cvs-br.vod.susercontent.com/api/v4/11110105/mms/br-11110105-6kfkq-m3xmjjl78qwl4f.16000081734531550.mp4';

export default function ProductLanding() {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedFlavor, setSelectedFlavor] = useState('Morango');
  const [cartCount, setCartCount] = useState(0);
  const [selectedReviewImage, setSelectedReviewImage] = useState<any>(null);
  const [reviewLikes, setReviewLikes] = useState({ review1: 87, review2: 32, review3: 69 });
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const maxWidth = isDesktop ? 480 : width;
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
      loadReviewLikes();
    }, [])
  );

  const loadCartCount = async () => {
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('session_id', sessionId);

      if (error) throw error;
      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      const sessionId = getSessionId();
      const { error } = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          product_name: 'Suplemento Alimentar Gummy Hair - 60 Unidades',
          product_price: 19.87,
          product_flavor: selectedFlavor,
          quantity: 1
        });

      if (error) throw error;
      await loadCartCount();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const loadReviewLikes = async () => {
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('review_likes')
        .select('*');

      if (error) throw error;

      const likes = { review1: 87, review2: 32, review3: 69 };
      const userLikes = new Set<string>();

      data?.forEach((item: any) => {
        if (item.review_id === 'review1') likes.review1 = item.like_count;
        if (item.review_id === 'review2') likes.review2 = item.like_count;
        if (item.review_id === 'review3') likes.review3 = item.like_count;

        if (item.user_session === sessionId && item.liked) {
          userLikes.add(item.review_id);
        }
      });

      setReviewLikes(likes);
      setLikedReviews(userLikes);
    } catch (error) {
      console.error('Error loading review likes:', error);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    try {
      const sessionId = getSessionId();
      const isCurrentlyLiked = likedReviews.has(reviewId);

      const { data: existing } = await supabase
        .from('review_likes')
        .select('*')
        .eq('review_id', reviewId)
        .maybeSingle();

      if (existing) {
        const newLikeCount = isCurrentlyLiked
          ? Math.max(0, existing.like_count - 1)
          : existing.like_count + 1;

        await supabase
          .from('review_likes')
          .update({ like_count: newLikeCount })
          .eq('review_id', reviewId);

        setReviewLikes(prev => ({
          ...prev,
          [reviewId]: newLikeCount
        }));
      } else {
        const defaultCounts: any = { review1: 87, review2: 32, review3: 69 };
        const newCount = isCurrentlyLiked ? defaultCounts[reviewId] : defaultCounts[reviewId] + 1;

        await supabase
          .from('review_likes')
          .insert({
            review_id: reviewId,
            like_count: newCount
          });

        setReviewLikes(prev => ({
          ...prev,
          [reviewId]: newCount
        }));
      }

      const { data: userLikeData } = await supabase
        .from('review_user_likes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_session', sessionId)
        .maybeSingle();

      if (userLikeData) {
        await supabase
          .from('review_user_likes')
          .update({ liked: !isCurrentlyLiked })
          .eq('review_id', reviewId)
          .eq('user_session', sessionId);
      } else {
        await supabase
          .from('review_user_likes')
          .insert({
            review_id: reviewId,
            user_session: sessionId,
            liked: true
          });
      }

      const newLikedReviews = new Set(likedReviews);
      if (isCurrentlyLiked) {
        newLikedReviews.delete(reviewId);
      } else {
        newLikedReviews.add(reviewId);
      }
      setLikedReviews(newLikedReviews);

    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleBuyNow = () => {
    console.log('Botão Compre Agora clicado!');
    console.log('Sabor selecionado:', selectedFlavor);
    try {
      router.push({
        pathname: '/checkout',
        params: {
          productName: 'Suplemento Alimentar Gummy Hair - 60 Unidades',
          productPrice: '19.87',
          productFlavor: selectedFlavor
        }
      });
    } catch (error) {
      console.error('Erro ao navegar:', error);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.container, isDesktop && { width: maxWidth, alignSelf: 'center' }]}>
        <TouchableOpacity style={styles.logoHeader} onPress={() => Linking.openURL('https://shopee.com.br/web')}>
          <Image
            source={require('@/assets/images/joigfjboigj copy.jpg')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>Promoção Gummy Hair - 60 Unidades</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/cart')}>
            <ShoppingCart color="#FF3D00" size={24} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
          <View style={[styles.imageContainer, { width: maxWidth }]}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / maxWidth);
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
              style={styles.imageCarousel}
            >
              {PRODUCT_IMAGES.map((image, index) => (
                <Image
                  key={index}
                  source={image}
                  style={[styles.productMainImage, { width: maxWidth }]}
                />
              ))}
            </ScrollView>
            <View style={styles.freightBadge}>
              <Image
                source={require('@/assets/images/1(1).png')}
                style={styles.freightImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.pagination}>
              <Text style={styles.paginationText}>{currentImageIndex + 1}/{PRODUCT_IMAGES.length}</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>R$19,87</Text>
                <Text style={styles.oldPrice}>R$82,99</Text>
                <Text style={styles.discount}>-76%</Text>
              </View>
              <TouchableOpacity onPress={() => setIsFavorited(!isFavorited)}>
                <Heart
                  color={isFavorited ? "#FF0066" : "#999"}
                  size={24}
                  fill={isFavorited ? "#FF0066" : "none"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.couponCard}>
              <Image
                source={require('@/assets/images/dcsdjcdsjiucju.png')}
                style={styles.couponLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.productInfo}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Indicado</Text>
              </View>
              <Text style={styles.productTitle}>Suplemento Alimentar Gummy Hair - 60 Unidades</Text>
            </View>

            <View style={styles.flavorSection}>
              <Text style={styles.flavorLabel}>Sabor</Text>
              <View style={styles.flavorOptions}>
                {FLAVORS.map((flavor) => (
                  <TouchableOpacity
                    key={flavor}
                    style={[
                      styles.flavorButton,
                      selectedFlavor === flavor && styles.flavorButtonSelected
                    ]}
                    onPress={() => setSelectedFlavor(flavor)}
                  >
                    <Text style={[
                      styles.flavorButtonText,
                      selectedFlavor === flavor && styles.flavorButtonTextSelected
                    ]}>
                      {flavor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedFlavor === 'Morango' && (
                <Text style={styles.stockWarning}>Restam apenas 2 unidades</Text>
              )}
              {selectedFlavor === 'Melancia' && (
                <Text style={styles.stockWarning}>Restam apenas 4 unidades</Text>
              )}
              {selectedFlavor === 'Maçã Verde' && (
                <Text style={styles.stockWarning}>Restam apenas 6 unidades</Text>
              )}
            </View>
          </View>

          <View style={styles.affiliateSection}>
            <Text style={styles.affiliateText}>ID do Afiliado: @emilly_belmont</Text>
          </View>

          <View style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <View style={styles.sellerLogoContainer}>
                <View style={styles.sellerLogo}>
                  <Image
                    source={require('../assets/images/br-11134216-7r98o-lxu42xqdszb34b_tn.webp')}
                    style={styles.drogasilLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.indicadoBadgeSmall}>
                  <Text style={styles.indicadoTextSmall}>Indicado</Text>
                </View>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>Droga Clara</Text>
                <View style={styles.officialBadge}>
                  <CheckCircle color="#00A859" size={14} fill="#00A859" />
                  <Text style={styles.officialText}>Loja Oficial</Text>
                </View>
                <View style={styles.sellerStatus}>
                  <View style={styles.statusDot} />
                  <Text style={styles.sellerStatusText}>Ativo há 5 minutos</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.storeButton}
                onPress={() => Linking.openURL('https://shopee.com.br/drogaclara')}
              >
                <Text style={styles.storeButtonText}>Ver página da Loja</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sellerStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>134</Text>
                <Text style={styles.statLabel}> produtos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>4.9</Text>
                <Text style={styles.statLabel}> Avaliação</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>75%</Text>
                <Text style={styles.statLabel}> Resposta</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Descrição do Produto</Text>
            </View>
            <View style={[styles.descriptionContent, !isDescExpanded && styles.descriptionCollapsed]}>
              <Text style={styles.descriptionText}>
                Gummy é a primeira vitamina em formato de coração do mundo. Com uma fórmula exclusiva, as gominhas contêm componentes que contribuem para a nutrição, crescimento e fortalecimento dos cabelos e unhas. Além disso, auxiliam na saúde da pele e fortalecem o sistema imunológico. As gominhas estão disponíveis nos sabores Tutti-Frutti, Melancia dos Sonhos, Uva do Céu e Maçã Verde.
              </Text>

              <Text style={styles.descriptionSubtitle}>DETALHES</Text>
              <Text style={styles.descriptionHighlight}>- Acelere o crescimento dos fios em até 6x</Text>
              <Text style={styles.descriptionHighlight}>- Tenha uma pele mais macia, lisa e saudável. Com apenas 02 gomas por dia</Text>
              <Text style={styles.descriptionHighlight}>- Seu cabelo 96% mais hidratado, sedoso e forte</Text>
              <Text style={styles.descriptionHighlight}>- Suas unhas mais resistentes e imunidade fortalecida</Text>
            </View>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsDescExpanded(!isDescExpanded)}
            >
              <Text style={styles.toggleButtonText}>
                {isDescExpanded ? 'Ver Menos' : 'Ver Mais'}
              </Text>
              {isDescExpanded ? (
                <ChevronUp color="#FF3D00" size={18} />
              ) : (
                <ChevronDown color="#FF3D00" size={18} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <View>
                <Text style={styles.reviewsTitle}>Avaliações do Produto</Text>
                <View style={styles.reviewsRating}>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} color="#FFB800" fill="#FFB800" size={12} />
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>4.9</Text>
                  <Text style={styles.ratingCount}>(284 avaliações)</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowDownloadPopup(true)}>
                <Text style={styles.viewAllLink}>Ver tudo {'>'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image
                  source={require('@/assets/images/7b0ae41737176334e6335ca7d735df5f_tn.jpeg')}
                  style={styles.reviewAvatar}
                />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewAuthor}>mariasilva99</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} color="#FFB800" fill="#FFB800" size={10} />
                    ))}
                  </View>
                  <Text style={styles.reviewText}>
                    Chegou super rápido! O sabor é maravilhoso, parece bala de verdade. Já estou sentindo meu cabelo mais forte com 2 semanas de uso.
                  </Text>
                  <View style={styles.reviewImages}>
                    <TouchableOpacity onPress={() => setSelectedReviewImage(require('@/assets/images/br-11134103-7r98o-m148lhgwk4uoda.webp'))}>
                      <Image
                        source={require('@/assets/images/br-11134103-7r98o-m148lhgwk4uoda.webp')}
                        style={styles.reviewImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedReviewImage(require('@/assets/images/br-11134103-7r98o-m148m4laq0y6f5.webp'))}>
                      <Image
                        source={require('@/assets/images/br-11134103-7r98o-m148m4laq0y6f5.webp')}
                        style={styles.reviewImage}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.reviewDate}>2024-10-15 14:30 | Variação: Morango</Text>
                  <TouchableOpacity
                    style={styles.reviewLikeButton}
                    onPress={() => handleLikeReview('review1')}
                  >
                    <ThumbsUp
                      color={likedReviews.has('review1') ? '#FF3D00' : '#666'}
                      fill={likedReviews.has('review1') ? '#FF3D00' : 'none'}
                      size={14}
                    />
                    <Text style={[styles.reviewLikeCount, likedReviews.has('review1') && { color: '#FF3D00' }]}>
                      {reviewLikes.review1}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image
                  source={require('@/assets/images/br-11134233-7r98o-m30qs38x9s5x4a_tn.jpeg')}
                  style={styles.reviewAvatar}
                />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewAuthor}>fabiolaalexandradelima</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} color="#FFB800" fill="#FFB800" size={10} />
                    ))}
                  </View>
                  <Text style={styles.reviewText}>
                    Veio bem embalado{'\n'}
                    Tá tudo certinho...{'\n'}
                    Veio lacrado{'\n'}
                    E o cheirinho e muito bom{'\n'}
                    Amei{'\n'}
                    Espero que tenho bons resultados usando.
                  </Text>
                  <View style={styles.reviewImages}>
                    <TouchableOpacity onPress={() => setSelectedReviewImage(require('@/assets/images/br-11134103-7r98o-m8zbttzdacl538.webp'))}>
                      <Image
                        source={require('@/assets/images/br-11134103-7r98o-m8zbttzdacl538.webp')}
                        style={styles.reviewImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedReviewImage(require('@/assets/images/br-11134103-7r98o-m8zbttzd8y0p07.webp'))}>
                      <Image
                        source={require('@/assets/images/br-11134103-7r98o-m8zbttzd8y0p07.webp')}
                        style={styles.reviewImage}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.reviewMetadata}>
                    <Text style={styles.reviewMetadataText}>Custo-benefício: bom</Text>
                    <Text style={styles.reviewMetadataText}>Parecido com anúncio: sim</Text>
                  </View>
                  <Text style={styles.reviewDate}>2024-12-08 16:37 | Variação: Morango - 2 Meses</Text>
                  <TouchableOpacity
                    style={styles.reviewLikeButton}
                    onPress={() => handleLikeReview('review2')}
                  >
                    <ThumbsUp
                      color={likedReviews.has('review2') ? '#FF3D00' : '#666'}
                      fill={likedReviews.has('review2') ? '#FF3D00' : 'none'}
                      size={14}
                    />
                    <Text style={[styles.reviewLikeCount, likedReviews.has('review2') && { color: '#FF3D00' }]}>
                      {reviewLikes.review2}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image
                  source={require('@/assets/images/br-11134233-7r98o-lqj3vol1t2cf17_tn.jpeg')}
                  style={styles.reviewAvatar}
                />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewAuthor}>vitriacristinaqueiroz</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} color="#FFB800" fill="#FFB800" size={10} />
                    ))}
                  </View>
                  <Text style={styles.reviewText}>
                    Primeira vez que vou usar. Já vi várias pessoas indicando e espero que realmente funcione.{'\n'}
                    Chegou certinho, dentro do prazo, e muito bem embalado. O gosto é maravilhoso, é realmente muito gostosa, dá vontade de comer um monte de uma vez.
                  </Text>
                  <View style={styles.reviewImages}>
                    <TouchableOpacity onPress={() => setSelectedReviewImage(require('@/assets/images/br-11134103-7r98o-m3jo0oltgmhn92.webp'))}>
                      <Image
                        source={require('@/assets/images/br-11134103-7r98o-m3jo0oltgmhn92.webp')}
                        style={styles.reviewImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedReviewImage(require('@/assets/images/br-11134103-7r98o-m3jo0oltjfmj4c.webp'))}>
                      <Image
                        source={require('@/assets/images/br-11134103-7r98o-m3jo0oltjfmj4c.webp')}
                        style={styles.reviewImage}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.reviewDate}>2025-04-24 18:43 | Variação: Morango - 2 Meses</Text>
                  <TouchableOpacity
                    style={styles.reviewLikeButton}
                    onPress={() => handleLikeReview('review3')}
                  >
                    <ThumbsUp
                      color={likedReviews.has('review3') ? '#FF3D00' : '#666'}
                      fill={likedReviews.has('review3') ? '#FF3D00' : 'none'}
                      size={14}
                    />
                    <Text style={[styles.reviewLikeCount, likedReviews.has('review3') && { color: '#FF3D00' }]}>
                      {reviewLikes.review3}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>VOCÊ TAMBÉM PODE GOSTAR</Text>

            <View style={styles.productsGrid}>
              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/prod_202108122026352122_1.png')}
                    style={styles.productImage}
                  />
                  <View style={styles.productDiscountBadge}>
                    <Text style={styles.productDiscountText}>-6%</Text>
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTextSmall}>Indicado</Text>
                  </View>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Óleo de Prímula (Ômega-6) 500 mg 60 Cápsulas
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$18,90</Text>
                    <Text style={styles.productCardSales}>4.9 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.9</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/br-11134207-81z1k-mg6d26o6s2yo0d.jpeg')}
                    style={styles.productImage}
                  />
                  <View style={[styles.productDiscountBadge, { backgroundColor: '#FF6B6B' }]}>
                    <Text style={styles.productDiscountText}>-30%</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play color="#fff" fill="#fff" size={12} />
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTextSmall}>Indicado</Text>
                  </View>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    FigoBom - Composto Para o Fígado 500ml
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$24,50</Text>
                    <Text style={styles.productCardSales}>1.2 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.9</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/kit-cronoday-capilar-cronograma-charmelle-cosm-ticos-brasil-atacado-revenda-distribuidor-97hraxkxcw.webp')}
                    style={styles.productImage}
                  />
                  <View style={styles.productDiscountBadge}>
                    <Text style={styles.productDiscountText}>-15%</Text>
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTextSmall}>Indicado</Text>
                  </View>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Kit Cronograma Capilar - Hidratação, Nutrição e Reconstrução
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$89,90</Text>
                    <Text style={styles.productCardSales}>2.1 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.8</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/3709514.webp')}
                    style={styles.productImage}
                  />
                  <View style={[styles.productDiscountBadge, { backgroundColor: '#FF6B6B' }]}>
                    <Text style={styles.productDiscountText}>-50%</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play color="#fff" fill="#fff" size={12} />
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Vitamina C 1000mg + Zinco - Imunidade Blindada 60 Comprimidos
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$29,90</Text>
                    <Text style={styles.productCardSales}>15 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.7</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/colageno_verisol_dermup_90_capsulas_maxinutri_2989_1_20240207144707.webp')}
                    style={styles.productImage}
                  />
                  <View style={styles.productDiscountBadge}>
                    <Text style={styles.productDiscountText}>-22%</Text>
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTextSmall}>Indicado</Text>
                  </View>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Colágeno Verisol Hialurônico - Pele Firme e Unhas Fortes
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$55,00</Text>
                    <Text style={styles.productCardSales}>800 vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>5.0</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/br-11134207-7r98o-m9vplcvd5lx51a.jpeg')}
                    style={styles.productImage}
                  />
                  <View style={styles.productDiscountBadge}>
                    <Text style={styles.productDiscountText}>-10%</Text>
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Kit 10 Máscaras Faciais Coreanas - Hidratação Profunda
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$39,90</Text>
                    <Text style={styles.productCardSales}>5.4 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.9</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/0717fe00f09a2ef32de0e47501845889.jpeg')}
                    style={styles.productImage}
                  />
                  <View style={[styles.productDiscountBadge, { backgroundColor: '#FF6B6B' }]}>
                    <Text style={styles.productDiscountText}>-35%</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play color="#fff" fill="#fff" size={12} />
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTextSmall}>Indicado</Text>
                  </View>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Escova Secadora 3 em 1 Alisadora 1200W Bivolt
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$79,90</Text>
                    <Text style={styles.productCardSales}>10 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.8</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/serum-rosa-mosqueta-frasco-copiar-r1rlx55u1p.webp')}
                    style={styles.productImage}
                  />
                  <View style={styles.productDiscountBadge}>
                    <Text style={styles.productDiscountText}>-18%</Text>
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Sérum Facial Rosa Mosqueta - Clareador de Manchas
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$12,99</Text>
                    <Text style={styles.productCardSales}>30 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.7</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/[.webp')}
                    style={styles.productImage}
                  />
                  <View style={styles.productDiscountBadge}>
                    <Text style={styles.productDiscountText}>-25%</Text>
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTextSmall}>Indicado</Text>
                  </View>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Shampoo e Condicionador Antiqueda com Biotina 2x500ml
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$45,90</Text>
                    <Text style={styles.productCardSales}>3.2 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.6</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.productCard} onPress={() => setShowDownloadPopup(true)}>
                <View style={styles.productImageContainer}>
                  <Image
                    source={require('@/assets/images/merheje-manicure-profissional-kit-alicate-lima-palito-espatula.webp')}
                    style={styles.productImage}
                  />
                  <View style={[styles.productDiscountBadge, { backgroundColor: '#FF6B6B' }]}>
                    <Text style={styles.productDiscountText}>-40%</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play color="#fff" fill="#fff" size={12} />
                  </View>
                  <View style={styles.productShippingBadge}>
                    <View style={styles.productShippingIcon}>
                      <Truck color="#245eb5" size={8} />
                    </View>
                    <Text style={styles.productShippingText}>FRETE GRÁTIS acima de R$10</Text>
                  </View>
                </View>
                <View style={styles.productCardInfo}>
                  <Text style={styles.productCardTitle} numberOfLines={2}>
                    Kit Manicure Profissional Elétrico - Unhas Perfeitas
                  </Text>
                  <View style={styles.productCardFooter}>
                    <Text style={styles.productCardPrice}>R$89,90</Text>
                    <Text style={styles.productCardSales}>6.8 mil vendidos</Text>
                  </View>
                  <View style={styles.productRating}>
                    <Star color="#FFB800" fill="#FFB800" size={10} />
                    <Text style={styles.ratingTextSmall}>4.8</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBold}>ID do Afiliado: @emilly_belmont</Text>
            <Text style={styles.footerText}>© 2025 Shopee. Todos os direitos reservados</Text>
            <Text style={styles.footerText}>CNPJ/MF nº 35.635.824/0001-12</Text>
            <Text style={styles.footerText}>
              Endereço: Av. Brigadeiro Faria Lima, 3732 - 22º e 23º andares, Itaim Bibi, São Paulo (SP), Brasil, 04538-1327
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomButton} onPress={() => router.push('/chat')}>
            <Image source={require('@/assets/images/1(1) copy.png')} style={{ width: 20, height: 20 }} />
            <Text style={styles.bottomButtonText}>Conversar agora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={handleAddToCart}>
            <Image source={require('@/assets/images/2.png')} style={{ width: 20, height: 20 }} />
            <Text style={styles.bottomButtonText}>Adicionar ao carrinho</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
            <Text style={styles.buyButtonText}>Compre agora</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={selectedReviewImage !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedReviewImage(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedReviewImage(null)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedReviewImage(null)}
              >
                <X color="#fff" size={30} />
              </TouchableOpacity>
              {selectedReviewImage && (
                <Image
                  source={selectedReviewImage}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showDownloadPopup}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDownloadPopup(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.downloadPopupContainer}
              activeOpacity={1}
              onPress={() => setShowDownloadPopup(false)}
            >
              <Image
                source={require('@/assets/images/joijjj.png')}
                style={styles.downloadPopupImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    maxWidth: 480,
  },
  logoHeader: {
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'web' ? 0 : 34,
    paddingBottom: 0,
    paddingHorizontal: 0,
    width: '100%',
    aspectRatio: 1200 / 200,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    color: '#999',
    fontWeight: '400',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3D00',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFD6E8',
    position: 'relative',
  },
  imageCarousel: {
    width: '100%',
    height: '100%',
  },
  productMainImage: {
    height: '100%',
  },
  freightBadge: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    height: 32,
    width: 200,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  freightImage: {
    height: '100%',
    width: undefined,
    aspectRatio: 'auto',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  paginationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priceSection: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  currentPrice: {
    fontSize: 20,
    color: '#FF3D00',
    fontWeight: '500',
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 12,
    color: '#FF3D00',
    fontWeight: 'bold',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 4,
  },
  couponCard: {
    backgroundColor: '#E0F2F1',
    borderRadius: 4,
    marginBottom: 12,
    height: 50,
    overflow: 'hidden',
  },
  couponLogo: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#FF3D00',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginBottom: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextSmall: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  productTitle: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  flavorSection: {
    marginTop: 16,
  },
  flavorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  flavorOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  flavorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  flavorButtonSelected: {
    borderColor: '#FF3D00',
    backgroundColor: '#FFF3E0',
  },
  flavorButtonText: {
    fontSize: 14,
    color: '#333',
  },
  flavorButtonTextSelected: {
    color: '#FF3D00',
    fontWeight: '500',
  },
  stockWarning: {
    fontSize: 13,
    color: '#FF6A00',
    marginTop: 8,
    fontWeight: '500',
  },
  affiliateSection: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  affiliateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6A00',
  },
  sellerCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sellerLogoContainer: {
    position: 'relative',
  },
  sellerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  drogasilLogo: {
    width: 40,
    height: 40,
  },
  indicadoBadgeSmall: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    backgroundColor: '#FF3D00',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  indicadoTextSmall: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  officialText: {
    fontSize: 12,
    color: '#00A859',
    fontWeight: '500',
  },
  sellerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  sellerStatusText: {
    fontSize: 10,
    color: '#666',
  },
  storeButton: {
    borderWidth: 1,
    borderColor: '#FF3D00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  storeButtonText: {
    color: '#FF3D00',
    fontSize: 12,
    fontWeight: '500',
  },
  sellerStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    justifyContent: 'space-around',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 12,
    color: '#FF3D00',
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  descriptionSection: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
  },
  sectionHeader: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionContent: {
    overflow: 'hidden',
  },
  descriptionCollapsed: {
    maxHeight: 100,
  },
  descriptionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  descriptionHighlight: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  descriptionSubtitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 4,
  },
  toggleButtonText: {
    fontSize: 13,
    color: '#FF3D00',
    fontWeight: '500',
  },
  reviewsSection: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reviewsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 13,
    color: '#FF3D00',
    fontWeight: '500',
  },
  ratingCount: {
    fontSize: 11,
    color: '#999',
  },
  viewAllLink: {
    fontSize: 11,
    color: '#FF3D00',
    fontWeight: '500',
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewImages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  reviewImage: {
    width: 64,
    height: 64,
    borderRadius: 4,
  },
  reviewImagePlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  reviewImagePlaceholderText: {
    fontSize: 10,
    color: '#999',
  },
  reviewMetadata: {
    marginBottom: 6,
  },
  reviewMetadataText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 10,
    color: '#999',
  },
  reviewLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  reviewLikeCount: {
    fontSize: 12,
    color: '#666',
  },
  avatarText: {
    color: '#999',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendationsSection: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    marginBottom: 8,
  },
  recommendationsTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 8,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDiscountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFB17A',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  productDiscountText: {
    color: '#8B0000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playButton: {
    position: 'absolute',
    bottom: 32,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    padding: 4,
  },
  videoContainer: {
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productShippingBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(36, 94, 181, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    gap: 2,
  },
  productShippingIcon: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 1,
  },
  productShippingText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  productCardInfo: {
    padding: 8,
  },
  productCardTitle: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
    marginBottom: 8,
  },
  productCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productCardPrice: {
    fontSize: 13,
    color: '#FF3D00',
    fontWeight: '500',
  },
  productCardSales: {
    fontSize: 10,
    color: '#999',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingTextSmall: {
    fontSize: 10,
    color: '#666',
  },
  footer: {
    padding: 24,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 80,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: 56,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: '#00BFA5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 10,
  },
  buyButton: {
    flex: 1.5,
    backgroundColor: '#FF3D00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  downloadPopupContainer: {
    width: '90%',
    maxWidth: 500,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadPopupImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
});
