// Update the service to use the API

export interface TableData {
  id: string;
  name: string;
  data: string[][];
}

export async function fetchAvailableTables(): Promise<TableData[]> {
  try {
    // In a real application, this would be an API call
    const response = await fetch("/api/tables");

    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching tables:", error);

    // Fallback to mock data if API fails
    return [
      {
        id: "table1",
        name: "Users Table",
        data: [
          ["ID", "Name", "Email"],
          ["1", "John Doe", "john@example.com"],
          ["2", "Jane Smith", "jane@example.com"],
        ],
      },
      {
        id: "table2",
        name: "Products Table",
        data: [
          ["ID", "Product", "Price", "Stock"],
          ["101", "Laptop", "$999", "45"],
          ["102", "Phone", "$699", "120"],
        ],
      },
      {
        id: "table3",
        name: "Orders Table",
        data: [
          ["Order ID", "Customer", "Total", "Status"],
          ["ORD-001", "John Doe", "$1299", "Shipped"],
          ["ORD-002", "Jane Smith", "$699", "Processing"],
        ],
      },
    ];
  }
}

export async function getTableById(id: string): Promise<TableData | null> {
  try {
    const response = await fetch(`/api/tables?id=${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch table: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching table by ID:", error);

    // Fallback to local search if API fails
    const tables = await fetchAvailableTables();
    return tables.find((table) => table.id === id) || null;
  }
}
