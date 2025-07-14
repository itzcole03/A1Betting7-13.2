export interface DataSource<T = unknown> {
  fetchData(): Promise<T>;
}
