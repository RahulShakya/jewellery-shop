import { TestBed } from '@angular/core/testing';
import { ApiService } from '@carat-line/api';
import { of } from 'rxjs';
import { ProductService } from './product.service';

describe('ProductService', () => {
  const api = {
    get: jest.fn(),
  };

  let service: ProductService;

  beforeEach(() => {
    api.get.mockReset();
    api.get.mockReturnValue(of({ data: [], meta: {} }));

    TestBed.configureTestingModule({
      providers: [ProductService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(ProductService);
  });

  it('serializes catalogue filters and name sorting', () => {
    service
      .list({
        search: 'gold ring',
        category: 'rings',
        metal: 'Rose Gold',
        minPrice: 10000,
        maxPrice: 80000,
        sort: 'name-desc',
        page: 2,
        perPage: 24,
        featured: true,
      })
      .subscribe();

    expect(api.get).toHaveBeenCalledWith(
      'products?search=gold+ring&category=rings&metal=Rose+Gold&min_price=10000&max_price=80000&sort=name-desc&page=2&per_page=24&featured=1',
    );
  });

  it('loads public catalogue filter options', () => {
    service.filterOptions().subscribe();

    expect(api.get).toHaveBeenCalledWith('products/filter-options');
  });
});
