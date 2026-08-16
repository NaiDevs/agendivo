alter table public.employees
  add column user_id uuid references auth.users (id) on delete set null,
  add column account_role text not null default 'employee'
    check (account_role in ('owner', 'employee'));

create unique index employees_business_user_unique
  on public.employees (business_id, user_id)
  where user_id is not null and deleted_at is null;
