import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto, OrderItemDto } from './src/modules/orders/dto/create-order.dto';

async function runTests() {
  console.log('=== [QA TEST SUITE: DTO & CONTRACT VALIDATION] ===\n');

  // Test Case 1: Valid Complete Payload
  console.log('TEST 1: Valid Payload with all Colombian COD fields & tier...');
  const validPayload = {
    customerName: 'Santiago Botero',
    email: '3015690382@cliente.kuropunk.com',
    phone: '3015690382',
    address: 'Calle 45 # 70-12 Apto 302',
    neighborhood: 'Laureles',
    city: 'Medellín',
    department: 'Antioquia',
    deliveryNotes: 'Casa reja negra, tocar el timbre',
    paymentMethod: 'EFECTIVO_CONTRAENTREGA',
    items: [
      {
        productId: 'the-wanderer',
        title: 'The Wanderer Flagship',
        price: 145000,
        quantity: 1,
        color: 'Asphalt',
        size: 'MED',
        tier: 'finished'
      },
      {
        productId: 'vandal-bear',
        title: 'Vandal Bear Pattern',
        price: 25000,
        quantity: 1,
        tier: 'digital'
      }
    ],
    shippingCost: 0,
    total: 170000
  };

  const dtoInstance = plainToInstance(CreateOrderDto, validPayload);
  const errors = await validate(dtoInstance);

  if (errors.length === 0) {
    console.log('✅ TEST 1 PASSED: Valid payload passed validation without errors.');
  } else {
    console.error('❌ TEST 1 FAILED:', errors);
    process.exit(1);
  }

  // Test Case 2: Invalid Email
  console.log('\nTEST 2: Invalid Email rejection test...');
  const invalidEmailPayload = {
    ...validPayload,
    email: 'not-an-email-at-all'
  };

  const invalidEmailDto = plainToInstance(CreateOrderDto, invalidEmailPayload);
  const emailErrors = await validate(invalidEmailDto);

  const hasEmailError = emailErrors.some(err => err.property === 'email');
  if (hasEmailError) {
    console.log('✅ TEST 2 PASSED: Invalid email correctly rejected by Class-Validator.');
  } else {
    console.error('❌ TEST 2 FAILED: Expected email validation error, but none was found.');
    process.exit(1);
  }

  // Test Case 3: Empty Customer Name
  console.log('\nTEST 3: Missing Customer Name rejection test...');
  const missingNamePayload = {
    ...validPayload,
    customerName: ''
  };

  const missingNameDto = plainToInstance(CreateOrderDto, missingNamePayload);
  const nameErrors = await validate(missingNameDto);

  const hasNameError = nameErrors.some(err => err.property === 'customerName');
  if (hasNameError) {
    console.log('✅ TEST 3 PASSED: Missing customerName correctly rejected.');
  } else {
    console.error('❌ TEST 3 FAILED: Expected customerName validation error.');
    process.exit(1);
  }

  console.log('\n===========================================');
  console.log('🎉 ALL QA INTEGRATION TESTS PASSED (100% OK)');
  console.log('===========================================');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
