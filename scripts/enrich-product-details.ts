/**
 * Enriquece produtos do Neon com galeria (CJ) + detalhes em português (anúncio).
 * Uso: npx tsx scripts/enrich-product-details.ts
 */
import { prisma } from "../src/lib/db";
import { galleryFromCjRaw } from "../src/lib/media";
import type { ProductDetails } from "../src/lib/product-details";

type Curated = {
  name?: string;
  /** Slug em português (opcional — renomeia o produto) */
  newSlug?: string;
  blurb: string;
  description: string;
  details: ProductDetails;
};

const CURATED: Record<string, Curated> = {
  "tapete-protetor-pet-carro": {
    name: "Tapete protetor para pet no carro",
    blurb: "132×160 cm · banco traseiro · Preto ou Laranja · impermeável.",
    description:
      "Capa/tapete para o banco traseiro do carro: protege de pelos, lama e arranhões quando o pet viaja. Medida 132 × 160 cm — cobre o banco traseiro da maioria dos sedãs e SUVs (não é sob medida de uma marca específica).",
    details: {
      highlights: [
        "Medida: 132 × 160 cm (banco traseiro)",
        "Cores: Preto ou Laranja",
        "Impermeável e fácil de limpar",
        "Serve na maioria dos carros de passeio — não é exclusivo de um modelo",
      ],
      useCases: [
        "Levar o cão no banco de trás sem sujar o estofado",
        "Proteger de lama depois da praia ou do parque",
        "Evitar pelos grudados no tecido do carro",
        "Viagens curtas e longas com pet",
      ],
      colors: ["Preto", "Laranja"],
      sizes: ["132×160 cm"],
      adjustable: true,
      sizeNote:
        "É um tamanho único universal (132×160 cm) para banco traseiro. Não existe versão “só Civic” ou “só Onix”: se o banco traseiro do seu carro for padrão de passeio/SUV compacto-médio, costuma servir. Em vans ou bancos muito largos, confira a medida com uma fita.",
      measurements: [
        { label: "Tamanho aberto", value: "132 × 160 cm" },
        { label: "Onde vai", value: "Banco traseiro (+ laterais)" },
        { label: "Cores", value: "Preto · Laranja" },
        { label: "Compatibilidade", value: "Maioria dos sedãs e SUVs (universal)" },
      ],
      faqs: [
        {
          q: "Serve em todos os modelos de carro?",
          a: "Não é sob medida de marca. É um tapete universal de 132×160 cm para banco traseiro. Na prática serve na maioria dos carros de passeio e SUVs. Se o banco for muito diferente (van, picape com banco estreito), meça antes.",
        },
        {
          q: "É carpete fixo no chão do carro?",
          a: "Não. É protetor/capa para o banco traseiro (onde o pet senta), não o carpete do assoalho.",
        },
        {
          q: "Molha e estraga o banco?",
          a: "A ideia é o contrário: a superfície impermeável segura sujeira e umidade para você limpar o tapete, não o estofado.",
        },
      ],
      includes: ["1 tapete protetor 132×160 cm (cor escolhida)"],
      materials: "Tecido impermeável com base que ajuda a não escorregar.",
      howToUse:
        "Abra sobre o banco traseiro, prenda nas laterais/apoios de cabeça conforme o modelo e acomode o pet. Depois do passeio, sacuda ou passe pano úmido.",
      care: "Limpe com pano úmido. Se lavar, seque bem antes de guardar.",
      longDescription:
        "Anúncio direto: é o tapete que você joga no banco de trás para o dog não destruir o carro. Tamanho 132 por 160 cm, duas cores (preto ou laranja). Não promete encaixe perfeito em 100% dos modelos — promete cobertura generosa no banco traseiro da maioria dos carros.",
    },
  },

  "massageador-eletrico-2-em-1": {
    name: "Massageador facial elétrico (luz + vibração)",
    blurb: "11,6×7×2,7 cm · bateria 600 mAh · USB 5V · branco.",
    description:
      "Aparelho portátil de massagem facial com vibração e terapia de luz vermelha/azul. Tamanho do aparelho: 11,6 × 7 × 2,7 cm. Bateria interna 600 mAh, carrega em USB 5V/1A (3W). Cor: branco.",
    details: {
      highlights: [
        "Medida do aparelho: 11,6 × 7 × 2,7 cm",
        "Bateria interna 600 mAh (recarregável)",
        "Carrega em USB 5V / 1A · 3W",
        "Massagem por vibração + luz vermelha e azul",
      ],
      useCases: [
        "Relaxar o rosto depois do dia",
        "Rotina de skincare em casa (gua sha elétrico)",
        "Estimular a circulação superficial com massagem leve",
        "Quem quer aparelho pequeno, não de academia",
      ],
      colors: ["Branco"],
      sizes: ["Único (11,6×7×2,7 cm)"],
      measurements: [
        { label: "Tamanho do aparelho", value: "11,6 × 7 × 2,7 cm" },
        { label: "Bateria", value: "600 mAh (interna, recarregável)" },
        { label: "Carregamento", value: "USB 5V / 1A · 3W" },
        { label: "Cor", value: "Branco" },
        { label: "Display", value: "LCD" },
      ],
      faqs: [
        {
          q: "Funciona com pilha?",
          a: "Não. Tem bateria interna de 600 mAh. Você carrega no USB (5V) com o cabo que acompanha.",
        },
        {
          q: "Qual o tamanho na mão?",
          a: "Cerca de 11,6 cm de comprimento por 7 cm de largura e 2,7 cm de espessura — cabe na mão e na necessaire.",
        },
        {
          q: "É massageador de costas grande?",
          a: "Não. É aparelho facial/portátil (gua sha elétrico + luz). Para costas profundas, não é o produto certo.",
        },
      ],
      includes: [
        "1 massageador",
        "1 cabo de carregamento USB",
        "1 manual",
      ],
      materials: "Corpo em plástico. Uso doméstico.",
      howToUse:
        "Carregue antes do primeiro uso. Ligue, escolha o modo e deslize com pressão leve no rosto. Evite olhos, feridas e pele inflamada.",
      care: "Desligue após o uso. Limpe com pano seco. Não submerja na água.",
      longDescription:
        "Se a dúvida é “que tamanho é esse massageador e se tem bateria”: aparelho branco de 11,6×7×2,7 cm, bateria 600 mAh recarregável no USB. Massagem por vibração + luz vermelha/azul para rotina facial em casa — não é o bastão gigante de fisioterapia.",
    },
  },

  "sabonete-facial-escova-silicone": {
    name: "Sabonete facial com escova de silicone",
    blurb: "R$ 34,90 · escova de silicone integrada · limpeza no banho.",
    description:
      "Sabonete facial com escova de silicone na própria peça — limpa e massageia no banho. Preço da unidade na loja: R$ 34,90 (à vista no site; pagamento no Mercado Pago).",
    details: {
      highlights: [
        "Preço: R$ 34,90 a unidade",
        "Escova de silicone integrada",
        "Limpeza + massagem no mesmo gesto",
        "Uso diário no banho",
      ],
      useCases: [
        "Trocar o sabonete comum por um com escovinha",
        "Limpeza mais mecânica que só a mão",
        "Rotina rápida de skincare no chuveiro",
      ],
      sizes: ["Único"],
      measurements: [
        { label: "Preço na loja", value: "R$ 34,90" },
        { label: "Formato", value: "Sabonete + escova de silicone" },
        { label: "Embalagem (aprox.)", value: "55 × 55 × 182 mm" },
      ],
      faqs: [
        {
          q: "Quanto custa?",
          a: "R$ 34,90 a unidade nesta loja (preço exibido no produto). Frete é calculado depois do pedido.",
        },
        {
          q: "A escova vem separada?",
          a: "Não — a escova de silicone já vem integrada no sabonete.",
        },
        {
          q: "Serve para pele sensível?",
          a: "Faça teste de toque. Se a pele estiver inflamada ou com ferida, evite esfregar com força.",
        },
      ],
      includes: ["1 sabonete facial com escova de silicone"],
      howToUse:
        "Molhe o rosto, faça espuma, massageie em círculos com a escova e enxágue bem. Evite os olhos.",
      care: "Guarde em local seco. Pare de usar se houver irritação.",
      longDescription:
        "Anúncio sem enrolação: sabonete facial com escovinha de silicone, R$ 34,90. É isso — limpeza no banho com massagem leve. Sem kit misterioso.",
    },
  },

  "vedante-impermeavel-cozinha-banheiro": {
    name: "Vedante para vazamento (cozinha e banheiro)",
    blurb: "Para fresta e furinho pingando · 30 g · cozinha e banheiro.",
    description:
      "Vedante impermeável em bisnaga (30 g) para aquele vazamento chato: fresta na parede, encontro de pia, box, azulejo ou cantinho que fica pingando umidade. Não é reforma estrutural de encanamento embutido — é selante de superfície para estancar respingo e infiltração rasa.",
    details: {
      highlights: [
        "Para fresta / furinho que pinga água",
        "Embalagem 30 g",
        "Cozinha, banheiro e áreas úmidas",
        "Selagem superficial — não substitui encanador em cano rompido",
      ],
      useCases: [
        "Fresta na junta da pia que fica úmida",
        "Cantinho do box pingando pela rejunção",
        "Encontro parede × bancada com infiltração rasa",
        "Pequeno ponto de umidade em azulejo/revestimento",
      ],
      sizes: ["30 g"],
      measurements: [
        { label: "Conteúdo", value: "30 g" },
        { label: "Uso", value: "Vedação de frestas e pontos de umidade" },
        { label: "Ambientes", value: "Cozinha e banheiro" },
      ],
      faqs: [
        {
          q: "Serve para cano estourado dentro da parede?",
          a: "Não. Isso é vedante de superfície para fresta/rejunção/encontro de peças. Cano rompido = encanador.",
        },
        {
          q: "É exatamente para o ‘furinho’ que vaza?",
          a: "Sim — o caso de uso é selar o pontinho/fresta por onde a água escapa ou a umidade aparece. Limpe, seque e aplique.",
        },
        {
          q: "Quanto vem?",
          a: "Bisnaga/unidade de 30 g — ideal para retoque pontual, não para impermeabilizar a casa inteira.",
        },
      ],
      includes: ["1 vedante 30 g"],
      howToUse:
        "1) Limpe e seque bem a fresta. 2) Aplique fino sobre o ponto que vaza. 3) Espere secar totalmente antes de molhar de novo. Se o vazamento for forte por pressão de cano, chame profissional.",
      care: "Mantenha fechado. Evite aplicar em superfície suja ou molhada.",
      longDescription:
        "O anúncio certo: não é “tinta mágica”. É o vedante do furinho/fresta que está pingando na cozinha ou no banheiro. 30 g, aplicação pontual. Se for cano estourado, não é esse produto.",
    },
  },

  "desengordurante-po-cozinha": {
    name: "Desengordurante em pó para cozinha",
    blurb: "100 g · coifa, fogão, cooktop e torneira · gordura pesada.",
    description:
      "Pó desengordurante (kit 100 g) para a gordura que o detergente comum não tira: coifa, grade do fogão, cooktop e torneira. Uso doméstico, por trechos, com luva.",
    details: {
      highlights: [
        "Kit 100 g",
        "Foco em gordura de cozinha",
        "Coifa · fogão · cooktop · torneira",
        "Para sujeira pesada do dia a dia",
      ],
      useCases: [
        "Coifa engordurada depois de meses sem lavar",
        "Grade e laterais do fogão com óleo queimado",
        "Cooktop com mancha de gordura acumulada",
        "Torneira e misturador com película oleosa",
        "Limpeza pesada de final de semana na cozinha",
      ],
      sizes: ["100 g"],
      measurements: [
        { label: "Conteúdo", value: "100 g (set)" },
        { label: "Onde usar", value: "Coifa, fogão, cooktop, torneira" },
        { label: "Formato", value: "Pó desengordurante" },
      ],
      faqs: [
        {
          q: "Quais os casos de uso?",
          a: "Gordura de cozinha: coifa, fogão, cooktop e torneira. Não é sabão de roupa — é limpeza pesada de óleo.",
        },
        {
          q: "Posso usar em madeira ou tecido?",
          a: "Não é o foco. Use em superfícies de cozinha laváveis (metal, inox, vidro de cooktop conforme o fabricante). Sempre teste num cantinho.",
        },
        {
          q: "Quanto vem?",
          a: "100 g no set — rende vários retoques se usar por trecho.",
        },
      ],
      includes: ["1 set desengordurante em pó 100 g"],
      howToUse:
        "Use luva. Umedeça a área, polvilhe o pó, esfregue com esponja e enxágue bem. Trabalhe por pedaços. Não misture com outros químicos. Não inale o pó.",
      care: "Fora do alcance de crianças. Guarde fechado e seco.",
      longDescription:
        "Casos de uso claros: coifa suja, fogão engordurado, cooktop e torneira. Pó 100 g para a limpeza pesada da cozinha — não é perfume, é desengordurante.",
    },
  },

  "colete-salva-vidas-pet": {
    name: "Colete salva-vidas para pet",
    blurb: "Cores várias · tamanhos XS–M · alça no dorso · flutuação.",
    description:
      "Colete salva-vidas para cães na água. Cores: amarelo, rosa, camuflado rosa, camuflado azul, roxo, azul, verde fluorescente, vermelho, flores laranja e estampa barquinho. Tamanhos em estoque: XS, S e M (ajuste por tiras). Nas fotos da galeria você vê o colete sozinho e com pet — use as miniaturas.",
    details: {
      highlights: [
        "Tamanhos: XS · S · M (ajuste por tiras)",
        "Várias cores e estampas",
        "Alça superior para erguer o pet",
        "Flutuação para praia, lago e piscina",
      ],
      useCases: [
        "Pet aprendendo a nadar",
        "Passeio de barco / stand-up",
        "Praia e lago com mais segurança",
        "Cão que se cansa rápido na água",
      ],
      colors: [
        "Azul",
        "Camuflado azul",
        "Verde fluorescente",
        "Flores laranja",
        "Rosa",
        "Camuflado rosa",
        "Roxo",
        "Vermelho",
        "Barquinho",
        "Amarelo",
      ],
      sizes: ["XS", "S", "M"],
      adjustable: true,
      sizeNote:
        "Meça a circunferência do peito do cão (volta completa atrás das patas dianteiras). Escolha XS/S/M e aperte as tiras. Em dúvida entre dois tamanhos, fique com o maior e ajuste. A galeria tem fotos do colete — troque a miniatura para ver o modelo sem depender só da foto com o dog.",
      measurements: [
        { label: "Tamanhos", value: "XS · S · M" },
        { label: "Ajuste", value: "Tiras no peito e barriga" },
        { label: "Cores", value: "10 opções (sólidas e estampadas)" },
        { label: "Uso", value: "Praia, lago, piscina, barco" },
      ],
      faqs: [
        {
          q: "Quais tamanhos tem?",
          a: "XS, S e M, com tiras ajustáveis. Meça o peito do pet antes de comprar.",
        },
        {
          q: "Quais cores?",
          a: "Azul, camuflado azul, verde fluorescente, flores laranja, rosa, camuflado rosa, roxo, vermelho, barquinho e amarelo.",
        },
        {
          q: "Tem foto sem o cachorro?",
          a: "Sim — na galeria há várias fotos do produto. Clique nas miniaturas abaixo da foto principal para ver o colete sozinho e as cores.",
        },
        {
          q: "Substitui supervisão na água?",
          a: "Não. É apoio de flutuação e segurança — você continua responsável pelo pet.",
        },
      ],
      includes: ["1 colete salva-vidas (cor e tamanho escolhidos)"],
      materials: "Poliéster com espuma de flutuação.",
      howToUse:
        "Vista, ajuste as tiras firme (sem apertar demais) e teste em água rasa. Use a alça do dorso só para apoio/resgate curto.",
      care: "Enxágue com água doce depois do mar e seque à sombra.",
      longDescription:
        "Colete de pet com cor e tamanho para escolher. Estoque atual: XS/S/M em várias cores. Galeria com mais de uma foto — inclusive ângulos do produto. Não é “um tamanho só misterioso”.",
    },
  },

  "comedouro-elevado-duplo-caes": {
    name: "Comedouro elevado duplo para cães",
    blurb: "Dois bowls · dobrável · ~37×27×12 cm · médios e grandes.",
    description:
      "Mesa/comedouro elevado dobrável com dois bowls — ração e água. Dimensão aproximada da estrutura: 37 × 27 × 12 cm. Pensado para cães médios e grandes; altura elevada para comer mais ereto.",
    details: {
      highlights: [
        "Dois bowls (ração + água)",
        "Estrutura ~37 × 27 × 12 cm",
        "Dobrável para guardar/viajar",
        "Melhor para portes médio e grande",
      ],
      useCases: [
        "Organizar canto da comida sem tigela no chão",
        "Cão grande que se incomoda abaixando demais",
        "Levar comedouro em viagem (dobra)",
        "Separar água e ração no mesmo suporte",
      ],
      sizes: ["Único (elevado / dobrável)"],
      adjustable: true,
      measurements: [
        { label: "Estrutura (aprox.)", value: "37 × 27 × 12 cm" },
        { label: "Formato", value: "Duplo (2 bowls)" },
        { label: "Peso embalado (aprox.)", value: "1,6 kg" },
      ],
      faqs: [
        {
          q: "Serve para filhote pequeno?",
          a: "O foco é médio/grande. Filhote muito baixo pode ficar alto demais — prefira comedouro baixo.",
        },
        {
          q: "É fixo ou dobra?",
          a: "Dobra. Por isso serve em casa e em viagem.",
        },
      ],
      includes: ["1 estrutura elevada dobrável", "2 bowls"],
      materials: "Estrutura plástica + bowls (silicone/plástico conforme o kit).",
      howToUse: "Abra a estrutura, encaixe os bowls, ajuste a altura se houver trava, e sirva.",
      care: "Lave os bowls com detergente neutro.",
      longDescription:
        "Comedouro duplo elevado e dobrável. Medida aproximada 37×27×12 cm — para quem quer o pet comendo mais alto, com água e ração no mesmo lugar.",
    },
  },

  "portable-11-in-1-multifunctional-cleaning-kit-computer-keyboard-cleaner-phone-sc":
    {
      newSlug: "kit-limpeza-11-em-1",
      name: "Kit limpeza 11 em 1",
      blurb: "Teclado, tela e fone · estojo · branco, roxo, laranja ou azul.",
      description:
        "Kit portátil de limpeza com várias pontas e escovas para teclado, tela de celular, notebook e fones. Vem em estojo compacto — cabe na mochila ou na gaveta da mesa.",
      details: {
        highlights: [
          "Kit multifuncional (várias pontas/escovas)",
          "Ideal para teclado, tela e fones",
          "Estojo compacto para guardar",
          "Cores: branco, roxo, laranja ou azul",
        ],
        useCases: [
          "Tirar poeira e migalha do teclado",
          "Limpar tela do celular sem arranhar",
          "Limpeza rápida de fones e case",
          "Levar no escritório ou na bolsa",
        ],
        colors: ["Branco", "Roxo", "Laranja", "Azul"],
        sizes: ["Único (kit + estojo)"],
        measurements: [
          { label: "Formato", value: "Kit 11 em 1 com estojo" },
          { label: "Uso", value: "Notebook, celular, teclado, fones" },
          { label: "Cores", value: "Branco · Roxo · Laranja · Azul" },
        ],
        faqs: [
          {
            q: "Serve para notebook e celular?",
            a: "Sim. As pontas cobrem teclado, tela e cantos pequenos (fone, case).",
          },
          {
            q: "Vem com estojo?",
            a: "Sim — o kit vem com caixa/estojo para guardar as peças.",
          },
          {
            q: "É produto profissional de limpeza química?",
            a: "Não. É kit de escovas/ferramentas de limpeza física — sem spray químico incluso.",
          },
        ],
        includes: ["1 kit de limpeza multifuncional com estojo (cor escolhida)"],
        materials: "Plástico ABS e cerdas/escovas conforme o kit.",
        howToUse:
          "Escolha a ponta certa, limpe a seco (ou com pano levemente úmido na tela) e guarde no estojo.",
        care: "Não molhe demais as cerdas. Guarde seco no estojo.",
        longDescription:
          "Kit barato e útil: várias pontas num estojo para limpar teclado, tela e fone sem improvisar cotonete. Quatro cores para escolher.",
      },
    },

  "wireless-car-vacuum-cleaner-portable-handheld-high-power-vacuum-cleaner-for-car-":
    {
      newSlug: "aspirador-portatil-sem-fio",
      name: "Aspirador portátil sem fio",
      blurb: "Carro, casa e teclado · sem fio · filtro lavável · preto ou branco.",
      description:
        "Aspirador de mão sem fio para carro, casa e cantos apertados (teclado, sofá). Bateria de lítio, sucção ciclone e filtro/copo laváveis. Ideal para migalha, areia e pó no dia a dia.",
      details: {
        highlights: [
          "Sem fio (bateria de lítio)",
          "Sucção ciclone para pó e migalha",
          "Filtro e copo laváveis",
          "Uso: carro, casa, escritório",
        ],
        useCases: [
          "Limpar banco e assoalho do carro",
          "Migalha no sofá e no teclado",
          "Pó em cantos onde o aspirador grande não entra",
          "Limpeza rápida entre uma faxina e outra",
        ],
        colors: ["Preto", "Branco"],
        sizes: ["Único (portátil de mão)"],
        measurements: [
          { label: "Tipo", value: "Aspirador de mão sem fio" },
          { label: "Filtro", value: "Lavável" },
          { label: "Cores", value: "Preto · Branco" },
        ],
        faqs: [
          {
            q: "Precisa de tomada no carro?",
            a: "Não na hora de aspirar — é sem fio. Você carrega a bateria antes (conforme o modelo).",
          },
          {
            q: "Substitui aspirador de casa grande?",
            a: "Não. É portátil para limpeza rápida e cantos. Para faxina pesada, use o aspirador principal.",
          },
          {
            q: "O filtro lava?",
            a: "Sim — filtro e copo são laváveis. Seque bem antes de usar de novo.",
          },
        ],
        includes: ["1 aspirador portátil sem fio (cor escolhida)"],
        materials: "Plástico + motor + filtro lavável.",
        howToUse:
          "Carregue, ligue, aspire o local e esvazie o copo. Lave o filtro quando notar perda de sucção.",
        care: "Esvazie o pó com frequência. Lave e seque o filtro antes de guardar.",
        longDescription:
          "Aspirador de mão sem fio para o carro e para os cantos da casa. Não é o aspirador “de faxina completa” — é o que você pega em 2 minutos para tirar areia e migalha.",
      },
    },

  "camping-sofa-inflatable-sofa-portable-air-bed-outdoor-airbed-casual-beach-reclin":
    {
      newSlug: "sofa-inflavel-camping",
      name: "Sofá inflável de camping",
      blurb: "Praia, camping e quintal · nylon · tamanhos S e L · várias cores.",
      description:
        "Sofá/espreguiçadeira inflável portátil para camping, praia e área externa. Nylon, dobra para levar na bolsa. Opções de tamanho S (padrão) e L (mais largo), em várias cores.",
      details: {
        highlights: [
          "Inflável e portátil (dobra para guardar)",
          "Nylon — uso externo (praia, camping, quintal)",
          "Tamanhos S e L (L mais largo)",
          "Várias cores (azul-marinho, amarelo café, azul-céu, verde…)",
        ],
        useCases: [
          "Camping e trilha com descanso no chão",
          "Praia / lago sem carregar cadeira pesada",
          "Quintal, piscina e churrasco",
          "Levar dobrado na mochila ou no porta-malas",
        ],
        colors: [
          "Azul-marinho",
          "Amarelo café",
          "Azul-céu",
          "Verde",
        ],
        sizes: ["S (padrão)", "L (mais largo)"],
        sizeNote:
          "S é o tamanho padrão; L é a versão mais larga/confortável. Confira a opção no pedido.",
        measurements: [
          { label: "Tamanhos", value: "S · L" },
          { label: "Material", value: "Nylon (camada simples)" },
          { label: "Uso", value: "Camping, praia, área externa" },
        ],
        faqs: [
          {
            q: "É colchão de casal?",
            a: "Não. É sofá/espreguiçadeira individual inflável. O L é mais largo, mas ainda é peça individual.",
          },
          {
            q: "Serve na água?",
            a: "Alguns modelos são usados como flutuador casual — use com cuidado e supervisão. Não é salva-vidas.",
          },
          {
            q: "Como enche?",
            a: "Conforme o modelo: muitos acompanham ou permitem enchimento rápido (ex.: saco/ventilador de dobra). Siga o manual da peça recebida.",
          },
        ],
        includes: ["1 sofá inflável (tamanho e cor escolhidos)"],
        materials: "Nylon.",
        howToUse:
          "Abra, encha conforme o modelo, use e esvazie para guardar dobrado.",
        care: "Evite objetos pontiagudos. Seque antes de guardar. Não deixe ao sol forte por horas sem necessidade.",
        longDescription:
          "Sofá inflável para levar no camping ou na praia sem cadeira de ferro. Nylon, dobra pequeno, tamanhos S e L e várias cores.",
      },
    },

  "portable-handheld-spray-fan-4-speed-water-spray-mist-fan-summer-cooling-artifact":
    {
      newSlug: "ventilador-mao-spray",
      name: "Ventilador de mão com spray",
      blurb: "Vento + névoa · 4 velocidades · USB · preto, branco ou rosa.",
      description:
        "Mini ventilador de mão com spray de água (névoa) e 4 velocidades. Combina vento e umidificação leve — útil no calor seco, na rua ou no escritório. Recarrega via USB.",
      details: {
        highlights: [
          "Ventilador + spray de névoa",
          "4 velocidades",
          "Recarregável via USB",
          "Cores: preto, branco ou rosa",
        ],
        useCases: [
          "Aliviar o calor na rua ou no ponto de ônibus",
          "Escritório / home office sem ar-condicionado forte",
          "Praia, fila e eventos ao ar livre",
          "Quem quer vento + um pouco de umidade",
        ],
        colors: ["Preto", "Branco", "Rosa"],
        sizes: ["Único (portátil de mão)"],
        measurements: [
          { label: "Funções", value: "Vento + névoa" },
          { label: "Velocidades", value: "4" },
          { label: "Carga", value: "USB" },
          { label: "Cores", value: "Preto · Branco · Rosa" },
        ],
        faqs: [
          {
            q: "Precisa de água?",
            a: "Para a névoa, sim — coloque água limpa no reservatório. Sem água, ainda funciona como ventilador.",
          },
          {
            q: "É só ventilador ou também joga água?",
            a: "Os dois: vento e névoa. Sem água no reservatório, funciona só como ventilador.",
          },
          {
            q: "Molha a roupa?",
            a: "A névoa é fina. Em velocidade alta e bem perto, pode umedecer um pouco — use com distância confortável.",
          },
        ],
        includes: ["1 ventilador de mão com spray (cor escolhida)"],
        materials: "Plástico + motor + reservatório de água.",
        howToUse:
          "Carregue via USB, coloque água limpa se quiser névoa, escolha a velocidade e use na mão.",
        care: "Esvazie a água antes de guardar. Não submerja o aparelho.",
        longDescription:
          "Ventilador de mão com spray: vento + névoa em 4 velocidades. USB e três cores — preto, branco ou rosa.",
      },
    },
};

async function main() {
  // Remove duplicata: turbo fan ≈ mesmo nicho do ventilador com spray
  const turbo = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: { contains: "turbo-jet-fan" } },
        { name: { contains: "Mini turbo fan" } },
      ],
    },
  });
  if (turbo) {
    await prisma.product.update({
      where: { id: turbo.id },
      data: { active: false },
    });
    console.log("desativado (duplicata)", turbo.slug);
  }

  const products = await prisma.product.findMany({
    include: { supplierProduct: true },
  });

  for (const p of products) {
    const curated =
      CURATED[p.slug] ||
      Object.values(CURATED).find((c) => c.newSlug && c.newSlug === p.slug);
    if (!curated) {
      console.log("skip (no curated)", p.slug);
      continue;
    }

    const raw = p.supplierProduct?.rawJson;
    let gallery = galleryFromCjRaw(raw, p.imageUrl);

    // Colete: prioriza variedade de fotos das variantes (produto em várias cores)
    if (
      (p.slug === "colete-salva-vidas-pet" ||
        curated.newSlug === "sofa-inflavel-camping" ||
        curated.newSlug === "ventilador-mao-spray" ||
        curated.newSlug === "kit-limpeza-11-em-1") &&
      Array.isArray((raw as { variants?: { variantImage?: string }[] })?.variants)
    ) {
      const fromVariants = [
        ...new Set(
          ((raw as { variants: { variantImage?: string }[] }).variants || [])
            .map((v) => v.variantImage)
            .filter((u): u is string => Boolean(u)),
        ),
      ];
      gallery = [...new Set([...fromVariants, ...gallery])].slice(0, 12);
    }

    const nextSlug = curated.newSlug || p.slug;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        slug: nextSlug,
        name: curated.name || p.name,
        blurb: curated.blurb,
        description: curated.description,
        gallery,
        details: curated.details,
        imageUrl: gallery[0] || p.imageUrl,
      },
    });

    console.log(
      "ok",
      p.slug,
      "→",
      nextSlug,
      "gallery",
      gallery.length,
      "faqs",
      curated.details.faqs?.length || 0,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
