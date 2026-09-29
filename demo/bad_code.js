/**
 * Расчёт итоговой цены заказа.
 *
 * Токен CRM берётся из переменной окружения SHOP_API_TOKEN.
 * Настоящее значение лежит в .env, который не коммитится; в .env.example
 * стоит заглушка.
 */

const API_TOKEN = process.env.SHOP_API_TOKEN || 'token-not-configured';

const PERCENT_DIVISOR = 100;
const ROUNDING_FACTOR = 100;
const VAT_RATE_PERCENT = 19;
const CRM_TIMEOUT_MS = 5000;

// Единая функция расчёта. Разница между сегментами — только ставка НДС.
function calculateTotal(price, quantity, discountPercent, vatPercent) {
  const subtotal = price * quantity;
  const discount = subtotal * (discountPercent / PERCENT_DIVISOR);
  const total = subtotal - discount;
  const withVat = total * (1 + vatPercent / PERCENT_DIVISOR);
  return Math.round(withVat * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

function sendOrderToCrm(order) {
  return {
    url: 'https://crm.example.com/orders',
    method: 'POST',
    timeoutMs: CRM_TIMEOUT_MS,
    headers: { Authorization: 'Bearer ' + API_TOKEN },
    body: order,
  };
}

function buildOrderTotal(order) {
  const vatPercent = order.segment === 'wholesale' ? VAT_RATE_PERCENT : 0;

  return calculateTotal(
    order.price,
    order.quantity,
    order.discountPercent,
    vatPercent,
  );
}

module.exports = {
  buildOrderTotal,
  calculateTotal,
  sendOrderToCrm,
};
