import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  accountStatus,
  parseUserListQuery,
  purgeDate,
  TRASH_DAYS,
  USERS_PAGE_SIZE,
  userListSearch,
  userScopes,
  type UserAction,
  type UserListQuery,
  type UserSort,
} from "@/features/account/lifecycle";
import { listUsers, purgeTrashedAccounts } from "@/lib/account-lifecycle";
import { currentAdmin } from "@/lib/admin";
import { accountConfig, requestOrigin } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  lock: "Account locked. Its sessions have ended and it cannot sign in.",
  unlock: "Account unlocked. It can sign in again.",
  trash: `Account moved to the trash. It cannot sign in and is deleted with all its data after ${TRASH_DAYS} days.`,
  restore: "Account restored from the trash.",
  self: "You cannot lock your own account or move it to the trash.",
  lastAdmin: "The last admin who can sign in cannot be locked or moved to the trash.",
  notFound: "That account no longer exists.",
  invalid: "Nothing changed: the request was not understood.",
};
const scopeLabels = { all: "All", active: "Active", locked: "Locked", trash: "Trash" };
const sortLabels: Record<UserSort, string> = {
  email: "Email",
  created: "Created",
  lastSignIn: "Last sign-in",
};

// UTC, to the minute: the admin page is English-only and has no locale formatting.
const when = (date: Date | null) =>
  date ? `${date.toISOString().slice(0, 16).replace("T", " ")} UTC` : "—";

function SortHeader({ query, sort }: { query: UserListQuery; sort: UserSort }) {
  const active = query.sort === sort;
  const dir = active && query.dir === "desc" ? "asc" : active ? "desc" : "asc";
  return (
    <th
      scope="col"
      aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <Link href={`/admin/users${userListSearch(query, { sort, dir, page: 1 })}`}>
        {sortLabels[sort]}
        {active ? (query.dir === "asc" ? " ↑" : " ↓") : ""}
      </Link>
    </th>
  );
}

function ActionForm({
  query,
  userId,
  action,
  label,
}: {
  query: UserListQuery;
  userId: string;
  action: UserAction;
  label: string;
}) {
  return (
    <form method="post" action="/api/admin/users">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="op" value={action} />
      <input type="hidden" name="return" value={userListSearch(query)} />
      <button type="submit">{label}</button>
    </form>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const config = accountConfig();
  if (!config.ready) notFound();
  const requestHeaders = await headers();
  const admin = await currentAdmin(
    requestOrigin(config, requestHeaders) || config.baseURL,
    requestHeaders,
  );
  if (!admin) notFound();

  const raw = await searchParams;
  const query = parseUserListQuery(raw);
  const notice = typeof raw.message === "string" ? messages[raw.message] : undefined;
  // Expired trash goes before the first page is read, so the list never shows an
  // account past its date (scripts/cleanup-auth.mjs also purges it).
  if (query.page === 1)
    await purgeTrashedAccounts().catch((error: unknown) =>
      console.error("Trash purge failed:", error instanceof Error ? error.name : "unknown"),
    );
  const { users, total } = await listUsers(query);
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));

  return (
    <div className="admin-users">
      <AdminNav current="/admin/users" email={admin.email} />
      <h1>Users</h1>
      {notice && <p role="status">{notice}</p>}
      <p>
        Locking an account ends its sessions and stops it signing in. The trash does the same and
        deletes the account with all its data after {TRASH_DAYS} days; until then it can be
        restored. Members can also delete their own account at once from the account page.
      </p>
      <form method="get" action="/admin/users" className="admin-filter" role="search">
        <label>
          Search email
          <input name="q" type="search" defaultValue={query.q} maxLength={200} />
        </label>
        <label>
          Show
          <select name="scope" defaultValue={query.scope}>
            {userScopes.map((scope) => (
              <option key={scope} value={scope}>
                {scopeLabels[scope]}
              </option>
            ))}
          </select>
        </label>
        {query.sort !== "created" && <input type="hidden" name="sort" value={query.sort} />}
        {query.dir !== "desc" && <input type="hidden" name="dir" value={query.dir} />}
        <button type="submit">Filter</button>
      </form>
      <p>
        {total === 1 ? "1 account" : `${total} accounts`}
        {pages > 1 && `, page ${query.page} of ${pages}`}.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <SortHeader query={query} sort="email" />
              <th scope="col">Status</th>
              <th scope="col">Sign-in</th>
              <SortHeader query={query} sort="created" />
              <SortHeader query={query} sort="lastSignIn" />
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const status = accountStatus(user);
              const self = user.id === admin.id;
              return (
                <tr key={user.id}>
                  <td>
                    {user.email}
                    {user.isAdmin && <span className="admin-tag">admin</span>}
                    {self && <span className="admin-tag">you</span>}
                  </td>
                  <td>
                    {status}
                    {user.deletedAt && <> (deleted after {when(purgeDate(user.deletedAt))})</>}
                    {user.deletedAt && user.lockedAt && <>, also locked</>}
                  </td>
                  <td>
                    {user.methods.join(", ") || "None"}
                    {!user.emailVerified && ", unverified"}
                  </td>
                  <td>{when(user.createdAt)}</td>
                  <td>{when(user.lastSignInAt)}</td>
                  <td className="admin-actions">
                    {!self &&
                      (user.lockedAt ? (
                        <ActionForm query={query} userId={user.id} action="unlock" label="Unlock" />
                      ) : (
                        <ActionForm query={query} userId={user.id} action="lock" label="Lock" />
                      ))}
                    {!self &&
                      (user.deletedAt ? (
                        <ActionForm
                          query={query}
                          userId={user.id}
                          action="restore"
                          label="Restore"
                        />
                      ) : (
                        <ActionForm query={query} userId={user.id} action="trash" label="Trash" />
                      ))}
                  </td>
                </tr>
              );
            })}
            {!users.length && (
              <tr>
                <td colSpan={6}>No accounts match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="admin-pages" aria-label="Pages">
          {query.page > 1 && (
            <Link href={`/admin/users${userListSearch(query, { page: query.page - 1 })}`}>
              ← Previous
            </Link>
          )}
          {query.page < pages && (
            <Link href={`/admin/users${userListSearch(query, { page: query.page + 1 })}`}>
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
