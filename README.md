# Rejestr maszyn

Ewidencja urządzeń sieciowych: hosty, adresy IP, lokalizacje, tagi i zależności między maszynami. Statyczna aplikacja (`index.html`, `app.js`, z Tailwind przez CDN), działa na GitHub Pages. Dane i ustawienia są w Supabase (logowanie e-mail + hasło), ustawienia dodatkowo cache'owane w `localStorage`.

Adres: https://kamilowebski.github.io/rejestr/

## Funkcje

- lista maszyn z wyszukiwaniem (kilka słów naraz), filtrem lokalizacji i typu, sortowaniem kolumn oraz paginacją (domyślnie 20 rekordów na stronę)
- wiele adresów IP na maszynę, wykrywanie duplikatów IP, tagi, notatki, oznaczenie sprzętu kluczowego
- zależności między maszynami i okno z drzewem zależności
- szybkie przyciski kopiujące komendy: `ping`, tunel SSH pod VNC, otwarcie `http://`, własne komendy ze zmiennymi `{host}`, `{name}`, `{ip}`, `{user}`, `{port}`
- generator skryptu PowerShell pingującego kluczowe maszyny lub grupę (maszyna + zależności) wyłącznie przez `PING.EXE`; tryb na żywo odświeża widok (czyści konsolę) domyślnie co 5 sekund, a `Ctrl+C` kończy skrypt
- ustawienia: własne kategorie sprzętu, widoczność przycisków, parametry pingu, login SSH i port VNC

## Pliki

| Plik | Opis |
| --- | --- |
| `index.html` | szkielet strony i struktura widoków |
| `app.js` | cała logika aplikacji, dane, Supabase, renderowanie i interakcje |
| `styles.css` | małe style niestandardowe uzupełniające Tailwind |
| `manifest.webmanifest` | manifest PWA (nazwa, kolory, ikony) |
| `icons/` | favicon, ikona Apple Touch, ikony 192/512 i maskable |

## Uruchomienie

Wrzuć zawartość repozytorium na hosting statyczny (np. GitHub Pages, gałąź `main`, katalog główny) albo otwórz `index.html` lokalnie. Wymagany jest internet: Tailwind (CDN 3.4.17 z wtyczką forms, `colors.page = #f4f7f9`), biblioteka Supabase (CDN, wersja przypięta) oraz `kamilowebski.github.io/hub/apps.js` (przycisk huba).

## Konfiguracja Supabase (jednorazowo, SQL Editor)

Tabela `machines` używa kolumn: `id`, `user_id`, `name`, `type`, `location`, `ips`, `deps`, `tags`, `note`, `key`, `created_at`, `updated_at`.

```sql
-- RLS: każdy widzi tylko swoje rekordy
alter table public.machines enable row level security;
create policy "own machines" on public.machines
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ustawienia (kategorie, komendy, widoczne przyciski) synchronizowane między urządzeniami
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cfg jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table public.user_settings enable row level security;
create policy "own settings" on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- updated_at ustawiany po stronie bazy, nie zegarem przeglądarki
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger machines_updated_at before update on public.machines
  for each row execute function public.set_updated_at();
```

Konta zakładasz ręcznie: Authentication → Users → Add user (zaznacz Auto Confirm User). Wyłącz też rejestrację nowych użytkowników. Klucz „publishable" w kodzie jest bezpieczny tylko przy włączonym RLS.

## Wspólny wygląd (Rejestr, Todo, Diary)

Wszystkie strony korzystają z tego samego systemu:

- tylko jasny motyw, tło `bg-page` (`#f4f7f9`), jeden akcent `blue-600`
- kontener `max-w-7xl mx-auto px-4 py-8 space-y-6`, nagłówek z tytułem po lewej i akcjami po prawej
- te same przyciski: główny (Dodaj, Zapisz), drugorzędny (Wyloguj, Anuluj), niebezpieczny (Usuń), ikony jako inline SVG
- logowanie jako karta `max-w-md` na stronie, okna `max-w-[560px]`, potwierdzenie `max-w-[400px]`
- przycisk huba (kwadraciki) w prawym górnym rogu na każdej stronie, ładowany z `hub/apps.js` do `<div id="hub-apps">`

## Uwagi

- Bez tabeli `user_settings` aplikacja działa, ale ustawienia zostają tylko w danej przeglądarce.
- Okna edycji maszyny i ustawień nie zamykają się kliknięciem w tło, żeby nie stracić wpisanych danych.
