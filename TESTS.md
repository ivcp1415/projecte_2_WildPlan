# Tests del projecte Wild Planner

## Back-end (Django REST Framework)

**Fitxer:** `back_end/planner/tests.py`
**Executar:** `python manage.py test planner`

Són **tests d'integració** que aixequen una base de dades SQLite temporal i fan
peticions HTTP reals contra els endpoints de l'API mitjançant `APIClient` de DRF.
No es mocka res del backend: les vistes, els serialitzadors, els permisos i la
generació del JWT s'executen tal com ho farien en producció.

### Què cobreixen

1. **Autenticació** — Registre d'un usuari nou, login amb credencials correctes
   (retorna token JWT vàlid) i rebuig amb credencials incorrectes (401).
2. **Perfil d'usuari** — Recuperació pública del perfil, edició del perfil propi
   i protecció enfront d'edicions del perfil d'altres usuaris (403).
3. **Rutes** — Llistat públic, recuperació amb comentaris i valoracions,
   creació autenticada amb nodes i trams associats, bloqueig de creació sense
   token, edició de metadades, eliminació i protecció contra edicions de
   propietaris diferents.
4. **Catàleg de materials i menjars** — Llistat públic i creació autenticada.
5. **Motxilles i planificacions** — Creació, llistat per usuari i recuperació
   d'una planificació amb la seva ruta associada.

L'objectiu és validar el **flux complet** (URL → permisos → serializer →
model → resposta JSON), no només funcions aïllades.

---

## Front-end (Vitest + React Testing Library)

**Configuració:** `vite.config.js` afegeix el bloc `test` amb entorn `jsdom`
i un fitxer de setup a `src/test/setup.js` que neteja el DOM i el
`localStorage` entre tests.

**Executar:**
```bash
npm install   # instal·la vitest i testing-library
npm test
```

### Fitxers de test

- `src/test/Navbar.test.jsx`
- `src/test/Login.test.jsx`
- `src/test/App.routing.test.jsx`

### Què cobreixen

1. **Navbar** — Renderització dels enllaços, comportament condicional segons
   el `token` del `localStorage` (mostra "Accedir" o "Sortir"), neteja del
   `localStorage` en fer logout, i obertura/tancament del menú hamburger
   responsive afegit en l'última iteració.
2. **Login** — Renderització del formulari, validació local de la contrasenya
   (no es crida l'API si el format és incorrecte), guardat correcte del token
   al `localStorage` quan la resposta és 200, i missatge d'error quan el
   backend retorna 401. Les crides `fetch` es mocken amb `vi.fn()`.
3. **Routing** — Comprovació mínima que React Router carrega el component
   correcte segons la URL.

L'objectiu és validar el **comportament des de la perspectiva de l'usuari**
(text que veu, clics, estat persistent al navegador) sense dependre del
backend real — totes les crides HTTP es mocken.
