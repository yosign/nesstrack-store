-- Adds an optional contact email to orders.
alter table public.orders
  add column if not exists email text;

comment on column public.orders.email is
  'Customer contact email for order notifications.';
