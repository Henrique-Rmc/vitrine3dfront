# Frontend Context: Vitrine3D

## Objective

A visual, Mobile-First web application where 3D printing professionals can showcase their products (action figures, props, technical parts) and receive quote requests directly via WhatsApp. The focus is entirely on the visual quality of the 3D printed items.

## Tech Stack

- **Framework:** React (or Next.js for better SEO and routing).
- **Styling:** Tailwind CSS.
- **State Management:** React Context or Zustand (for user session and global state).
- **HTTP Client:** Axios or native Fetch API (to consume the Spring Boot backend).

## Coding Standards (Strict Rules)

- **Language:** All code elements (variables, functions, components, hooks, state, and file names) MUST be written in English.
- **Modularity:** Keep components small, reusable, and decoupled. Use specific folders like `src/components`, `src/pages`, `src/hooks`, and `src/services`.

## UI/UX Guidelines (Design System)

- **Mobile-First:** Layouts must be optimized for mobile screens first, scaling up gracefully to desktop (`md:`, `lg:` prefixes in Tailwind).
- **Color Palette (Dark Mode Native):** - Backgrounds: Dark and neutral (e.g., `bg-zinc-950` or `bg-neutral-900`) to make the product images stand out.
  - Text: Light and readable (`text-zinc-100`, `text-zinc-400` for secondary text).
  - Accents: A vibrant color (like electric blue or neon green) for primary actions, specifically the WhatsApp button.
- **Typography:** Clean, sans-serif fonts (e.g., Inter or Roboto).
- **Cards & Images:** Use subtle rounded corners (`rounded-lg` or `rounded-xl`) and soft shadows (`shadow-lg`). Images should have a hover effect (`scale-105` with `transition-transform`).

## Application Views

### 1. Public Storefront (Client View)

- **Header:** Sticky top navigation. Displays `storeName` and a dynamic horizontal scroll or dropdown for `categoryList`.
- **Hero Section:** Features the top 3 best-selling or highlighted products (`FeaturedProductCard`) with large, high-impact imagery.
- **Product Catalog:** A grid layout listing `ProductCard` components.
- **ProductCard Component:** Displays `imageUrl`, `name`, `material`, and `dimensions`. Must include a "Solicitar Orçamento" button that triggers `handleWhatsAppRedirect(whatsappNumber, productName)`.

### 2. Admin Dashboard (Seller View)

- **Authentication:** Login screen with email and password.
- **Dashboard Layout:** A sidebar or top navigation distinct from the public storefront.
- **Product Management:** - A clean form to create/edit a product (Inputs: `name`, `description`, `material`, `categoryId`, `isVisible`, and image upload).
  - A list or table of existing products with quick actions to edit or delete.
- **Category Management:** Interface to view global categories and create custom ones.

## Integration Rules

- Base API URL should be configured via environment variables (e.g., `VITE_API_BASE_URL` or `NEXT_PUBLIC_API_URL`).
- Image URLs returned by the backend (MinIO) must be rendered directly in `src` attributes.
- Use `SkeletonLoading` components for async data fetching to improve perceived performance.

## API Data Models (Contracts)

The frontend components and forms must strictly use these data structures to ensure seamless integration with the API.

### User

- `id` (Long)
- `email` (String)
- `password` (String)
- `userName` (String)
- `storeName` (String)
- `whatsappNumber` (String)
- `storeDescription` (String)
- `logoUrl` (String)
- `createdAt` (Instant)
- `updatedAt` (Instant)
- `isActive` (Boolean)

### Category

- `id` (Long)
- `name` (String)
- `isGlobal` (Boolean)
- `userId` (Long)

### Product

- `id` (Long)
- `name` (String)
- `description` (String)
- `imageUrl` (String - from MinIO bucket)
- `material` (String)
- `multicolor` (Boolean)
- `dimensions` (String)
- `isVisible` (Boolean)
- `categoryId` (Long)
- `userId` (Long)


# Endpoints da API

**Configurações Globais**

* **Base URL:** `http://localhost:8080`
* **Header de Autenticação:** `Authorization: Bearer <token>`
* **Swagger Completo:** `http://localhost:8080/api-docs`

---

## 1. Auth (Autenticação)

| Método        | Endpoint            | Auth | Body / Params           |
| :------------- | :------------------ | :--: | :---------------------- |
| **POST** | `/api/auth/login` |  —  | `{ email, password }` |

> **Resposta de Sucesso:** `{ token, id, email, userName, storeName, slug }`

---

## 2. Usuários

| Método        | Endpoint                    | Auth | Body / Params                                                                                   |
| :------------- | :-------------------------- | :--: | :---------------------------------------------------------------------------------------------- |
| **POST** | `/api/users/register`     |  —  | `{ email, password, userName, storeName, whatsappNumber, storeDescription, stateId, cityId }` |
| **GET**  | `/api/users/{id}`         |  —  | —                                                                                              |
| **GET**  | `/api/users/store/{slug}` |  —  | —                                                                                              |
| **PUT**  | `/api/users/{id}`         | JWT | `{ userName?, storeName?, whatsappNumber?, storeDescription?, stateId?, cityId? }`            |
| **POST** | `/api/users/{id}/logo`    | JWT | `multipart/form-data`: `logo` (arquivo)                                                     |

---

## 3. Produtos

| Método          | Endpoint                                 | Auth | Body / Params                                                           |
| :--------------- | :--------------------------------------- | :--: | :---------------------------------------------------------------------- |
| **GET**    | `/api/products/store/{storeId}/public` |  —  | —                                                                      |
| **GET**    | `/api/products/store/{storeId}`        | JWT | —                                                                      |
| **GET**    | `/api/products/{id}`                   |  —  | —                                                                      |
| **POST**   | `/api/products`                        | JWT | `multipart/form-data`: `data` (JSON), `image` (arquivo, opcional) |
| **PUT**    | `/api/products/{id}`                   | JWT | `multipart/form-data`: `data` (JSON), `image` (arquivo, opcional) |
| **PATCH**  | `/api/products/{id}/visibility`        | JWT | —                                                                      |
| **DELETE** | `/api/products/{id}`                   | JWT | —                                                                      |
| **POST**   | `/api/products/scrape`                 | JWT | `{ url }`                                                             |

> **Notas do Produto:**
>
> * **Campo `data` (POST/PUT produto):** `{ "name", "description", "material", "dimensions", "multicolor", "categoryId", "storeId" }`
> * **Resposta do produto inclui:** `whatsappUrl` (link wa.me pronto para uso).

---

## 4. Categorias

| Método          | Endpoint                 | Auth | Body / Params                     |
| :--------------- | :----------------------- | :--: | :-------------------------------- |
| **GET**    | `/api/categories`      |  —  | —                                |
| **POST**   | `/api/categories`      | JWT | `{ name, isGlobal?, storeId? }` |
| **PUT**    | `/api/categories/{id}` | JWT | `{ name }`                      |
| **DELETE** | `/api/categories/{id}` | JWT | —                                |

---

## 5. Localização

| Método       | Endpoint                              | Auth | Body / Params |
| :------------ | :------------------------------------ | :--: | :------------ |
| **GET** | `/api/locations/states`             |  —  | —            |
| **GET** | `/api/locations/states/{id}/cities` |  —  | —            |

## Key Integration Features

1. **Scraping Data:** The UI might need a specific input field for a MakerWorld URL so the backend JSoup scraper can automatically fetch `name`, `description`, and `imageUrl`.
   2
