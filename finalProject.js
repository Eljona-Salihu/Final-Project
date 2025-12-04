// DOMAIN CLASSES
class Customer {
  constructor(customerID, customerName, customerPhoneNumber, customerEmail, customerPasswordHash) {
    this.customerID = customerID;
    this.customerName = customerName;
    this.customerPhoneNumber = customerPhoneNumber;
    this.customerEmail = customerEmail;
    this.customerPasswordHash = customerPasswordHash;
  }

  getCustomerID() {
    return this.customerID;
  }

  verifyPassword(password, encoder) {
    return encoder.matches(password, this.customerPasswordHash);
  }

  updateProfile(details) {
    if (!details) return false;
    this.customerName = details.name || this.customerName;
    this.customerPhoneNumber = details.phoneNumber || this.customerPhoneNumber;
    this.customerEmail = details.email || this.customerEmail;
    return true;
  }
}

class Slot {
  constructor(startTime, endTime) {
    this.startTime = new Date(startTime);
    this.endTime = new Date(endTime);
  }

  overlaps(other) {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }
}

class ReservationDetails {
  constructor(slot, numberOfGuests) {
    this.slot = slot;
    this.numberOfGuests = numberOfGuests;
  }
}

class Table {
  constructor(tableID, tableWaiter, tableCapacity, tableLocation) {
    this.tableID = tableID;
    this.tableWaiter = tableWaiter;
    this.tableCapacity = tableCapacity;
    this.tableLocation = tableLocation;
    this.availableSlots = [];
  }

  isAvailable(slot) {
    return this.availableSlots.some(s => !s.overlaps(slot));
  }

  markReserved(slot) {
    this.availableSlots = this.availableSlots.filter(s => !s.overlaps(slot));
    return true;
  }
}

class Restaurant {
  constructor(restaurantID, restaurantName, restaurantAddress, restaurantOpeningHours) {
    this.restaurantID = restaurantID;
    this.restaurantName = restaurantName;
    this.restaurantAddress = restaurantAddress;
    this.restaurantOpeningHours = restaurantOpeningHours;
    this.tables = [];
  }

  findAvailableTables(slot, guests) {
    return this.tables.filter(table => table.tableCapacity >= guests && table.isAvailable(slot));
  }

  addTable(table) {
    this.tables.push(table);
  }

  removeTable(tableId) {
    this.tables = this.tables.filter(t => t.tableID !== tableId);
  }
}

// PAYMENT CLASSES (Refactored for OCP)
class Payment {
  constructor(paymentID, paymentAmount, paymentMethod, paymentStatus, reservationID) {
    this.paymentID = paymentID;
    this.paymentAmount = paymentAmount;
    this.paymentMethod = paymentMethod;
    this.paymentStatus = paymentStatus;
    this.reservationID = reservationID;
  }

  processPayment() {
    this.paymentStatus = 'Processed';
    return true;
  }

  refundPayment() {
    this.paymentStatus = 'Refunded';
    return true;
  }
}

// STRATEGY PATTERN for Payment Methods
class PaymentStrategy {
  processPayment(amount) {
    throw new Error('Method not implemented');
  }
 
  refundPayment(amount) {
    throw new Error('Method not implemented');
  }
}

class CreditCardPayment extends PaymentStrategy {
  processPayment(amount) {
    console.log(`Processing credit card payment of $${amount}`);
    return true;
  }
 
  refundPayment(amount) {
    console.log(`Refunding credit card payment of $${amount}`);
    return true;
  }
}

class CashPayment extends PaymentStrategy {
  processPayment(amount) {
    console.log(`Processing cash payment of $${amount}`);
    return true;
  }
 
  refundPayment(amount) {
    console.log(`Refunding cash payment of $${amount}`);
    return true;
  }
}

class PayPalPayment extends PaymentStrategy {
  processPayment(amount) {
    console.log(`Processing PayPal payment of $${amount}`);
    return true;
  }
 
  refundPayment(amount) {
    console.log(`Refunding PayPal payment of $${amount}`);
    return true;
  }
}

// OCP compliant PaymentProcessor
class PaymentProcessor {
  constructor(paymentRepository, paymentStrategy) {
    this.paymentRepository = paymentRepository;
    this.paymentStrategy = paymentStrategy; // Polymorphic dependency
  }

  setPaymentStrategy(paymentStrategy) {
    this.paymentStrategy = paymentStrategy;
  }

  processPayment(payment) {
    const result = this.paymentStrategy.processPayment(payment.paymentAmount);
    if (result) {
      payment.processPayment();
      this.paymentRepository.save(payment);
    }
    return result;
  }

  refundPayment(payment) {
    const result = this.paymentStrategy.refundPayment(payment.paymentAmount);
    if (result) {
      payment.refundPayment();
    }
    return result;
  }
}

// REPOSITORIES
class PaymentRepository {
  constructor() {
    this.payments = [];
  }

  save(payment) {
    this.payments.push(payment);
    return true;
  }

  findByID(paymentId) {
    return this.payments.find(p => p.paymentID === paymentId);
  }

  findByReservation(reservationId) {
    return this.payments.find(p => p.reservationID === reservationId);
  }
}

// RESERVATION CLASSES
class Reservation {
  constructor(reservationID, reservationDate, reservationTime, numberOfGuests, customer, table, details, payment) {
    this.reservationID = reservationID;
    this.reservationDate = reservationDate;
    this.reservationTime = reservationTime;
    this.numberOfGuests = numberOfGuests;
    this.reservationStatus = 'Pending';
    this.customer = customer;
    this.table = table;
    this.details = details;
    this.payment = payment;
  }

  confirm() {
    this.reservationStatus = 'Confirmed';
    return true;
  }

  cancel() {
    this.reservationStatus = 'Cancelled';
    return true;
  }

  updateDetails(details) {
    this.details = details;
    return true;
  }

  processPayment() {
    return this.payment ? this.payment.processPayment() : false;
  }
}

// SERVICE CLASSES (Refactored for SRP)
class AuthenticationService {
  constructor(userRepository, passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  registerCustomer(details) {
    const encodedPassword = this.passwordEncoder.encode(details.password);
    const newCustomer = new Customer(Date.now(), details.name, details.phoneNumber, details.email, encodedPassword);
    this.userRepository.save(newCustomer);
    return new AuthResponse('token123', newCustomer);
  }

  login(email, password) {
    const user = this.userRepository.findByEmail(email);
    if (user && this.passwordEncoder.matches(password, user.customerPasswordHash)) {
      return new AuthResponse('token123', user);
    }
    return null;
  }

  getCurrentCustomer(token) {
    return this.userRepository.findByID(1); // Mock - would decode token in real implementation
  }
}

class ReservationServiceFacade {
  constructor(reservationService, paymentService, notificationService) {
    this.reservationService = reservationService;
    this.paymentService = paymentService;
    this.notificationService = notificationService;
  }

  createReservation(token, details) {
    const reservation = this.reservationService.createReservation(token, details);
    if (reservation) {
      this.notificationService.sendConfirmation(reservation.customer, reservation);
    }
    return reservation;
  }

  cancelReservation(token, reservationId) {
    const cancelled = this.reservationService.cancelReservation(token, reservationId);
    if (cancelled) {
      this.notificationService.sendCancellation(reservationId);
    }
    return cancelled;
  }

  processReservationPayment(token, reservationId, paymentDetails) {
    return this.paymentService.processReservationPayment(token, reservationId, paymentDetails);
  }
}

// SRP compliant services
class ReservationService {
  constructor(restaurant, authService) {
    this.restaurant = restaurant;
    this.authService = authService;
    this.reservations = [];
  }

  createReservation(token, details) {
    const customer = this.authService.getCurrentCustomer(token);
    const tables = this.restaurant.findAvailableTables(details.slot, details.numberOfGuests);
   
    if (tables.length === 0) {
      throw new Error('No available tables for the selected slot');
    }
   
    // STRATEGY for table selection
    const table = this.selectBestTable(tables, details.numberOfGuests);
    const reservation = new Reservation(
      Date.now(),
      details.slot.startTime,
      details.slot.endTime,
      details.numberOfGuests,
      customer,
      table,
      details,
      null
    );
   
    table.markReserved(details.slot);
    this.reservations.push(reservation);
    reservation.confirm();
   
    return reservation;
  }

  selectBestTable(tables, numberOfGuests) {
    // STRATEGY PATTERN: Could have different table selection strategies
    // Current strategy: pick the smallest table that fits the guests
    return tables
      .filter(t => t.tableCapacity >= numberOfGuests)
      .sort((a, b) => a.tableCapacity - b.tableCapacity)[0];
  }

  cancelReservation(token, reservationId) {
    const reservation = this.reservations.find(r => r.reservationID === reservationId);
    if (reservation) {
      reservation.cancel();
      return true;
    }
    return false;
  }

  findReservation(token, reservationId) {
    return this.reservations.find(r => r.reservationID === reservationId) || null;
  }

  getCustomerReservations(token) {
    const customer = this.authService.getCurrentCustomer(token);
    return this.reservations.filter(r => r.customer.customerID === customer.customerID);
  }
}
