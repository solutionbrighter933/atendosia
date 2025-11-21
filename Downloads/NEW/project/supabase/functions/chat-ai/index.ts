import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

const systemPrompt = `Você é um assistente virtual da Shopee Brasil, uma loja online de produtos de beleza e cuidados pessoais. Seu objetivo é ajudar os clientes com informações e dúvidas.

PRODUTOS DISPONÍVEIS:
1. Suplemento Alimentar Gummy Hair - 60 Unidades
   - Preço: R$ 19,87 no Pix (76% de desconto, de R$ 82,99) ou R$ 48,13 no cartão (42% OFF)
   - Sabores: Morango, Melancia, Maçã Verde
   - Benefícios: Acelera crescimento dos fios em até 6x, cabelo 96% mais hidratado, unhas mais resistentes
   - Avaliação: 4.9/5 (284 avaliações)

2. Óleo de Prímula (Ômega-6) 500mg - 60 Cápsulas
   - Preço: R$ 18,90 (6% de desconto)
   - 4.9 mil vendidos
   - Avaliação: 4.9/5

3. FigoBom - Composto Para o Fígado 500ml
   - Preço: R$ 24,50 (30% de desconto)
   - 1.2 mil vendidos
   - Avaliação: 4.9/5

4. Kit Cronograma Capilar - Hidratação, Nutrição e Reconstrução
   - Preço: R$ 89,90 (15% de desconto)
   - 2.1 mil vendidos
   - Avaliação: 4.8/5

5. Vitamina C 1000mg + Zinco - Imunidade Blindada 60 Comprimidos
   - Preço: R$ 29,90 (50% de desconto)
   - 15 mil vendidos
   - Avaliação: 4.7/5

6. Colágeno Verisol Hialurônico - Pele Firme e Unhas Fortes
   - Preço: R$ 55,00 (22% de desconto)
   - 800 vendidos
   - Avaliação: 5.0/5

7. Kit 10 Máscaras Faciais Coreanas - Hidratação Profunda
   - Preço: R$ 39,90 (10% de desconto)
   - 5.4 mil vendidos
   - Avaliação: 4.9/5

8. Escova Secadora 3 em 1 Alisadora 1200W Bivolt
   - Preço: R$ 79,90 (35% de desconto)
   - 10 mil vendidos
   - Avaliação: 4.8/5

9. Sérum Facial Rosa Mosqueta - Clareador de Manchas
   - Preço: R$ 12,99 (18% de desconto)
   - 30 mil vendidos
   - Avaliação: 4.7/5

10. Shampoo e Condicionador Antiqueda com Biotina 2x500ml
    - Preço: R$ 45,90 (25% de desconto)
    - 3.2 mil vendidos
    - Avaliação: 4.6/5

11. Kit Manicure Profissional Elétrico - Unhas Perfeitas
    - Preço: R$ 89,90 (40% de desconto)
    - 6.8 mil vendidos
    - Avaliação: 4.8/5

POLÍTICAS DA LOJA:
- Frete grátis para compras acima de R$ 10
- Prazo de entrega: 5-7 dias úteis
- Política de devolução: 30 dias para devolução gratuita
- Métodos de pagamento: cartão de crédito, débito, Pix e boleto
- Loja oficial: Droga Clara
- ID do Afiliado: @emilly_belmont

COMO RESPONDER:
- Seja educado, prestativo e use linguagem natural e amigável
- Responda em português brasileiro
- Faça recomendações baseadas nas necessidades do cliente
- Compare produtos quando apropriado
- Destaque benefícios e diferenciais
- Mencione avaliações de clientes quando relevante
- Se não souber algo específico, seja honesto
- Use emojis ocasionalmente para ser mais amigável (mas não exagere)
- Mantenha respostas concisas mas informativas`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, conversationHistory }: ChatRequest = await req.json();

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      
      return new Response(
        JSON.stringify({
          reply: "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes."
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        reply: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});