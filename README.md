# Rejestr maszyn

Lokalna aplikacja do ewidencji urządzeń sieciowych. Dane są przechowywane w `localStorage` przeglądarki; regularnie korzystaj z eksportu JSON jako kopii zapasowej.

## Uruchomienie

Otwórz `index.html` w nowoczesnej przeglądarce albo opublikuj pliki statyczne na hostingu.

## Pliki

- `index.html` — struktura aplikacji i okna dialogowe.
- `styles.css` — wygląd, motywy i responsywność.
- `app.js` — logika, zapis danych, filtrowanie, zależności, import/eksport i generowanie skryptów PowerShell.

## Ważne

- Dane pozostają w pamięci lokalnej konkretnej przeglądarki i nie synchronizują się automatycznie między urządzeniami.
- Eksport JSON przechowuj w bezpiecznym miejscu, zwłaszcza jeśli rejestr zawiera wewnętrzne adresy IP lub informacje o infrastrukturze.
- Import w trybie zastępowania wymaga teraz dodatkowego potwierdzenia.
