-- Records the payment method the customer chose at checkout (mbway / multibanco
-- / card). Actual charge/capture is still handled by the payment adapter, which
-- fails closed until a provider is configured.
alter table orders add column if not exists payment_method text not null default '';
