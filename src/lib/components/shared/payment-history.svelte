<script lang="ts">
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
  import { Input } from "$lib/components/ui/input";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
  import Icon from "@iconify/svelte";
  import { formatDateShort } from "$lib/utils";
  import type { Payment } from "$lib/types/document";

  interface Props {
    payments: Payment[];
    loading?: boolean;
    showFilters?: boolean;
  }

  let { payments, loading = false, showFilters = true }: Props = $props();

  let searchQuery = $state("");
  let selectedMethod = $state("all");
  let sortBy = $state("date_desc");

  let filteredAndSortedPayments = $derived(() => {
    let filtered = payments.filter((payment) => {
      const matchesSearch =
        searchQuery === "" ||
        payment.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod = selectedMethod === "all" || payment.paymentMethod === selectedMethod;

      return matchesSearch && matchesMethod;
    });

    // Sort payments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return b.paymentDate.toMillis() - a.paymentDate.toMillis();
        case "date_asc":
          return a.paymentDate.toMillis() - b.paymentDate.toMillis();
        case "amount_desc":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  });

  const paymentMethods = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "check", label: "Check" },
    { value: "cash", label: "Cash" },
    { value: "paypal", label: "PayPal" },
    { value: "other", label: "Other" },
  ];

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }



  function getPaymentMethodLabel(method: string): string {
    const methodObj = paymentMethods.find(m => m.value === method);
    return methodObj ? methodObj.label : method;
  }

  function clearFilters() {
    searchQuery = "";
    selectedMethod = "all";
    sortBy = "date_desc";
  }
</script>

<div class="space-y-4">
  {#if showFilters}
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[200px]">
        <label for="search" class="text-sm font-medium">Search</label>
        <Input
          id="search"
          bind:value={searchQuery}
          placeholder="Search by reference, notes, or method..."
          class="mt-1"
        />
      </div>
      <div class="w-48">
        <label for="method" class="text-sm font-medium">Payment Method</label>
        <Select type="single" bind:value={selectedMethod}>
          <SelectTrigger class="mt-1">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {#each paymentMethods as method (method.value)}
              <SelectItem value={method.value}>
                {method.label}
              </SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      <div class="w-48">
        <label for="sort" class="text-sm font-medium">Sort By</label>
        <Select type="single" bind:value={sortBy}>
          <SelectTrigger class="mt-1">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
            <SelectItem value="amount_desc">Highest Amount</SelectItem>
            <SelectItem value="amount_asc">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onclick={clearFilters} size="sm">
        <Icon icon="lucide:x" class="h-4 w-4 mr-2" />
        Clear
      </Button>
    </div>
  {/if}

  <!-- Payment History Table -->
  {#if loading}
    <div class="text-center py-8">Loading payments...</div>
  {:else if filteredAndSortedPayments().length === 0}
    <div class="text-center py-8 text-muted-foreground">
      <Icon icon="lucide:credit-card" class="h-12 w-12 mx-auto mb-4 opacity-50" />
      {#if payments.length === 0}
        <p>No payments recorded yet</p>
      {:else}
        <p>No payments match your filters</p>
      {/if}
    </div>
  {:else}
    <div class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each filteredAndSortedPayments() as payment (payment.id)}
            <TableRow>
              <TableCell class="font-medium">
                {formatDateShort(payment.paymentDate)}
              </TableCell>
              <TableCell class="font-medium text-green-600">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
              <TableCell class="font-mono text-sm">
                {payment.reference || "-"}
              </TableCell>
              <TableCell class="max-w-xs truncate" title={payment.notes}>
                {payment.notes || "-"}
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    {#if showFilters && filteredAndSortedPayments().length !== payments.length}
      <div class="text-sm text-muted-foreground text-center py-2">
        Showing {filteredAndSortedPayments().length} of {payments.length} payments
      </div>
    {/if}
  {/if}
</div>