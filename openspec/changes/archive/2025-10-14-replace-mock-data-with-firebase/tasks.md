## 1. Firebase Schema Design

- [x] 1.1 Design Firestore collections for clients, invoices, payments, documents, templates, metrics
- [x] 1.2 Define security rules for each collection
- [x] 1.3 Create TypeScript interfaces for all Firebase documents

## 2. Client Management Store

- [x] 2.1 Replace loadClients with Firebase query (where companyId == currentCompany)
- [x] 2.2 Replace createClient with Firebase addDoc
- [x] 2.3 Replace addClient with Firebase setDoc
- [x] 2.4 Replace inviteClient with Firebase updateDoc
- [x] 2.5 Replace updateClient with Firebase updateDoc
- [x] 2.6 Add real-time listeners for client changes

## 3. Invoice Management Store

- [x] 3.1 Replace mockClientInvoices with Firebase query (where clientId == currentUser)
- [x] 3.2 Add Firebase query for invoice creation/updates
- [x] 3.3 Add real-time listeners for invoice changes

## 4. Payment Management Store

- [x] 4.1 Replace loadPayments with Firebase query (where companyId == currentCompany)
- [x] 4.2 Replace loadPaymentsForInvoice with Firebase query (where invoiceId == id)
- [x] 4.3 Replace recordPayment with Firebase addDoc
- [x] 4.4 Replace updatePayment with Firebase updateDoc
- [x] 4.5 Replace deletePayment with Firebase deleteDoc

## 5. Document Management Store

- [x] 5.1 Replace loadClientDocuments with Firebase query (where clientId == currentUser)
- [x] 5.2 Add Firebase operations for document status updates
- [x] 5.3 Add real-time listeners for document changes

## 6. Template Management Store

- [x] 6.1 Replace mockTemplates with Firebase query (where companyId == currentCompany)
- [x] 6.2 Add Firebase operations for template CRUD
- [x] 6.3 Add real-time listeners for template changes

## 7. Metrics Store

- [x] 7.1 Replace mockCompanyMetrics with Firebase aggregation queries
- [x] 7.2 Implement real-time metrics calculation
- [x] 7.3 Add Firebase listeners for metrics updates

## 8. API Routes Updates

- [ ] 8.1 Update API routes to use Firebase Admin SDK for server-side operations
- [x] 8.2 Add proper error handling and validation
- [ ] 8.3 Test all API endpoints with Firebase data

## 9. Testing & Validation

- [ ] 9.1 Update unit tests for stores to mock Firebase instead of using mock data
- [ ] 9.2 Add integration tests for Firebase operations
- [ ] 9.3 Test real-time updates across components
