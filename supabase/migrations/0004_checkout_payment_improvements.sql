-- Migration 0004: Checkout Payment Improvements

-- Add payment_method and cod_fee to orders table
ALTER TABLE orders ADD COLUMN payment_method text not null default 'RAZORPAY';
ALTER TABLE orders ADD COLUMN cod_fee numeric(10,2) not null default 0;

-- Optionally, add constraints to payment_method
ALTER TABLE orders ADD CONSTRAINT chk_payment_method CHECK (payment_method IN ('RAZORPAY', 'CARD', 'COD'));
