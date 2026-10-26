# Rejestr maszyn

Aplikacja do ewidencji urządzeń sieciowych. Jeden plik statyczny (`index.html`, bez własnego CSS, stylowanie wyłącznie Tailwind), działa na GitHub Pages. Dane maszyn i ustawienia są w Supabase (logowanie e-mail + hasło); ustawienia są dodatkowo cache'owane w `localStorage`.

## Uruchomienie

Wrzuć `index.html` na hosting statyczny (np. GitHub Pages) albo otwórz lokalnie. Wymagany jest dostęp do internetu: Tailwind (CDN 3.4.17 z wtyczką forms, config `colors.page = #f4f7f9`) i biblioteka Supabase (CDN, wersja przypięta).

## Konfiguracja Supabase (jednorazowo, SQL Editor)

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

Dodatkowo w panelu Supabase (Authentication) wyłącz rejestrację nowych użytkowników. Klucz „publishable" w kodzie jest bezpieczny tylko przy włączonym RLS.

## Ważne

- Bez tabeli `user_settings` aplikacja działa, ale ustawienia zostają tylko w danej przeglądarce.
- Przed większym importem zrób eksport JSON jako kopię zapasową.
- Import „Zastąp" najpierw zapisuje nowe dane, potem usuwa stare, więc przerwanie nie kasuje całej bazy. Wymaga potwierdzenia.
- Okna logowania, edycji maszyny i ustawień nie zamykają się kliknięciem w tło.
