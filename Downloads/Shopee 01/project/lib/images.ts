const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ykvvltnfhzbqykxcizij.supabase.co';
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/produtos`;

export const getImageUrl = (filename: string): string => {
  return `${STORAGE_URL}/${filename}`;
};

export const PRODUCT_IMAGES = {
  GUMMY_HAIR_1: getImageUrl('br-11134207-81z1k-mgcf9alczbbb80.webp'),
  GUMMY_HAIR_2: getImageUrl('br-11134207-81z1k-mgcf9ald3j0n54.webp'),
  GUMMY_HAIR_3: getImageUrl('br-11134207-7r98o-m2ba0e8a58w6ec.webp'),
  GUMMY_HAIR_CART: getImageUrl('br-11134103-7r98o-m148lhgwk4uoda.webp'),

  SHOPEE_LOGO: getImageUrl('joigfjboigj.jpg'),
  DROGASIL_LOGO: getImageUrl('1(1).png'),
  MERCADO_LIVRE_LOGO: getImageUrl('dcsdjcdsjiucju.png'),

  PRODUCT_THUMBNAIL: getImageUrl('br-11134216-7r98o-lxu42xqdszb34b_tn.webp'),

  REVIEWER_1: getImageUrl('7b0ae41737176334e6335ca7d735df5f_tn.jpeg'),
  REVIEW_1_IMAGE_1: getImageUrl('br-11134103-7r98o-m148lhgwk4uoda.webp'),
  REVIEW_1_IMAGE_2: getImageUrl('br-11134103-7r98o-m148m4laq0y6f5.webp'),

  REVIEWER_2: getImageUrl('br-11134233-7r98o-m30qs38x9s5x4a_tn.jpeg'),
  REVIEW_2_IMAGE_1: getImageUrl('br-11134103-7r98o-m8zbttzdacl538.webp'),
  REVIEW_2_IMAGE_2: getImageUrl('br-11134103-7r98o-m8zbttzd8y0p07.webp'),

  REVIEWER_3: getImageUrl('br-11134233-7r98o-lqj3vol1t2cf17_tn.jpeg'),
  REVIEW_3_IMAGE_1: getImageUrl('br-11134103-7r98o-m3jo0oltgmhn92.webp'),
  REVIEW_3_IMAGE_2: getImageUrl('br-11134103-7r98o-m3jo0oltjfmj4c.webp'),

  SERUM_GLICERINA: getImageUrl('prod_202108122026352122_1.png'),
  OLE_ESSENCIAIS: getImageUrl('br-11134207-81z1k-mg6d26o6s2yo0d.jpeg'),
  KIT_CRONODAY: getImageUrl('kit-cronoday-capilar-cronograma-charmelle-cosm-ticos-brasil-atacado-revenda-distribuidor-97hraxkxcw.webp'),
  KIT_VITAMINAS: getImageUrl('3709514.webp'),
  COLAGENO: getImageUrl('colageno_verisol_dermup_90_capsulas_maxinutri_2989_1_20240207144707.webp'),
  BIOTINA: getImageUrl('br-11134207-7r98o-m9vplcvd5lx51a.jpeg'),
  OLE_REPARACAO: getImageUrl('0717fe00f09a2ef32de0e47501845889.jpeg'),
  SERUM_MOSQUETA: getImageUrl('serum-rosa-mosqueta-frasco-copiar-r1rlx55u1p.webp'),
  KIT_MANICURE: getImageUrl('merheje-manicure-profissional-kit-alicate-lima-palito-espatula.webp'),

  PIX_LOGO: getImageUrl('20250919160711_logo-pix-icone-1024.png'),

  FRETE_GRATIS: getImageUrl('joijjj.png'),

  PRODUCT_ICON_1: getImageUrl('1(1).png'),
  PRODUCT_ICON_2: getImageUrl('2.png'),
};

export default { getImageUrl, PRODUCT_IMAGES };
