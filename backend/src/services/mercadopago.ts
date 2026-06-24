import { MercadoPagoConfig, Preference } from 'mercadopago';

export interface MPItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
}

export async function createPaymentLink(params: {
  accessToken: string;
  items: MPItem[];
  currency?: string;
  externalRef: string;
}): Promise<string> {
  const client = new MercadoPagoConfig({ accessToken: params.accessToken });
  const preference = new Preference(client);
  const publicUrl = process.env.PUBLIC_URL ?? 'http://localhost:3001';

  const response = await preference.create({
    body: {
      items: params.items.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        currency_id: params.currency ?? 'ARS',
      })),
      back_urls: {
        success: `${publicUrl}/payment/success`,
        failure: `${publicUrl}/payment/failure`,
        pending: `${publicUrl}/payment/pending`,
      },
      auto_return: 'approved',
      notification_url: `${publicUrl}/payment/notification`,
      external_reference: params.externalRef,
    },
  });

  const url = response.init_point;
  if (!url) throw new Error('MercadoPago no devolvió init_point');
  return url;
}
