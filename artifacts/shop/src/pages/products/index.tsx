import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useListProducts, useListCategories, getListProductsQueryKey } from "@workspace/api-client-react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = Parameters<typeof ProductCard>[0]["product"];

export default function ProductsPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [page, setPage] = useState(1);

  const queryParams = {
    search: search || undefined,
    category: category ? parseInt(category) : undefined,
    sort: sort || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
    page,
    limit: 24,
  };

  const { data, isLoading } = useListProducts(queryParams);
  const { data: categories } = useListCategories();

  const products = (data as { products: Product[]; total: number } | undefined);
  const cats = Array.isArray(categories) ? (categories as { id: number; name: string }[]) : [];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl flex-shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filter & Sort</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 py-4">
              <div>
                <p className="text-sm font-semibold mb-2">Sort by</p>
                <Select value={sort} onValueChange={v => { setSort(v === "default" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Price range: RWF {priceRange[0].toLocaleString()} – RWF {priceRange[1].toLocaleString()}</p>
                <Slider min={0} max={50000} step={500} value={priceRange} onValueChange={v => setPriceRange(v)} className="mt-2" />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Select value={sort} onValueChange={v => { setSort(v === "default" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-10 w-36 rounded-xl text-sm hidden sm:flex">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price_asc">Price: Low–High</SelectItem>
            <SelectItem value="price_desc">Price: High–Low</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => { setCategory(""); setPage(1); }}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!category ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          All
        </button>
        {cats.map(c => (
          <button
            key={c.id}
            onClick={() => { setCategory(String(c.id)); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === String(c.id) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!isLoading && products && (
        <p className="text-sm text-muted-foreground mb-3">{products.total} product{products.total !== 1 ? "s" : ""} found</p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : (products?.products ?? []).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-foreground font-semibold">No products found</p>
          <p className="text-muted-foreground text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products?.products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {products && products.total > 24 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl">Previous</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" disabled={page * 24 >= products.total} onClick={() => setPage(p => p + 1)} className="rounded-xl">Next</Button>
        </div>
      )}
    </div>
  );
}
