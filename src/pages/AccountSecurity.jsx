import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/AccountSecurity.css";

const ACCOUNT_ROLES = ["HR", "MANAGER", "EMPLOYEE"];

function AccountSecurity() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all(
        ACCOUNT_ROLES.map((role) => api.get(`/users/role/${role}`)),
      );

      const loadedAccounts = responses.flatMap((response) =>
        Array.isArray(response.data) ? response.data : [],
      );

      // The permanent ADMIN account is deliberately excluded.
      setAccounts(
        loadedAccounts.filter((account) =>
          ACCOUNT_ROLES.includes(String(account.role || "").toUpperCase()),
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Unable to load accounts. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesSearch =
        !query ||
        String(account.name || "")
          .toLowerCase()
          .includes(query) ||
        String(account.email || "")
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        String(account.role || "").toUpperCase() === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        String(account.status || "").toUpperCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, search, roleFilter, statusFilter]);

  const activeCount = accounts.filter(
    (account) => String(account.status).toUpperCase() === "ACTIVE",
  ).length;

  const suspendedCount = accounts.filter(
    (account) => String(account.status).toUpperCase() === "SUSPENDED",
  ).length;

  const inactiveCount = accounts.filter(
    (account) => String(account.status).toUpperCase() === "INACTIVE",
  ).length;

  const handleMarkInactive = async (account) => {
    const status = String(account.status || "").toUpperCase();

    if (status === "INACTIVE") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to mark ${account.name} (${account.email}) as INACTIVE?\n\n` +
        "This account will no longer be eligible to log in. " +
        "This action cannot be reversed from this page.",
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(account.id);
    setError("");
    setSuccess("");

    try {
      const response = await api.put(`/users/${account.id}/inactive`);

      setSuccess(
        typeof response.data === "string"
          ? response.data
          : "Account marked inactive successfully.",
      );

      await loadAccounts();
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
              "Unable to mark this account inactive.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "ACTIVE":
        return "account-security-status-active";
      case "SUSPENDED":
        return "account-security-status-suspended";
      case "INACTIVE":
        return "account-security-status-inactive";
      default:
        return "account-security-status-unknown";
    }
  };

  return (
    <div className="account-security-page">
      <div className="account-security-header">
        <div>
          <p className="account-security-eyebrow">ADMINISTRATION</p>
          <h1>Account Security</h1>
          <p className="account-security-description">
            Review account statuses and manage employee departures.
          </p>
        </div>

        <button
          type="button"
          className="account-security-refresh"
          onClick={loadAccounts}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="account-security-notice">
        <span className="account-security-notice-icon">ⓘ</span>
        <div>
          <strong>Account status management</strong>
          <p>
            Mark an account INACTIVE when its employee leaves the company.
            Suspended accounts continue to use the existing helpdesk unlock
            workflow.
          </p>
        </div>
      </div>

      {error && (
        <div className="account-security-message account-security-error">
          {String(error)}
        </div>
      )}

      {success && (
        <div className="account-security-message account-security-success">
          {success}
        </div>
      )}

      <div className="account-security-summary">
        <div className="account-security-summary-card">
          <span>Total Accounts</span>
          <strong>{accounts.length}</strong>
          <small>HR, Managers and Employees</small>
        </div>

        <div className="account-security-summary-card">
          <span>Active</span>
          <strong>{activeCount}</strong>
          <small>Accounts with ACTIVE status</small>
        </div>

        <div className="account-security-summary-card">
          <span>Suspended</span>
          <strong>{suspendedCount}</strong>
          <small>Follow the unlock workflow</small>
        </div>

        <div className="account-security-summary-card">
          <span>Inactive</span>
          <strong>{inactiveCount}</strong>
          <small>Former employee accounts</small>
        </div>
      </div>

      <section className="account-security-panel">
        <div className="account-security-panel-heading">
          <div>
            <h2>Employee Accounts</h2>
            <p>
              Search accounts, review their status, and mark eligible accounts
              inactive.
            </p>
          </div>

          <span className="account-security-result-count">
            {filteredAccounts.length} result
            {filteredAccounts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="account-security-filters">
          <div className="account-security-search">
            <label htmlFor="account-security-search">Search accounts</label>
            <input
              id="account-security-search"
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="account-security-filter">
            <label htmlFor="account-security-role">Role</label>
            <select
              id="account-security-role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="ALL">All roles</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div className="account-security-filter">
            <label htmlFor="account-security-status">Status</label>
            <select
              id="account-security-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="account-security-state">
            <div className="account-security-spinner" />
            <p>Loading employee accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="account-security-state">
            <span className="account-security-empty-icon">⌕</span>
            <h3>No accounts found</h3>
            <p>Try changing the search text or selecting a different filter.</p>
          </div>
        ) : (
          <div className="account-security-table-wrapper">
            <table className="account-security-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Role</th>
                  <th>Joining Date</th>
                  <th>Employment Type</th>
                  <th>Work Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAccounts.map((account) => {
                  const status = String(account.status || "").toUpperCase();

                  const isInactive = status === "INACTIVE";
                  const isProcessing = processingId === account.id;

                  return (
                    <tr key={account.id}>
                      <td>
                        <div className="account-security-person">
                          <div className="account-security-avatar">
                            {String(account.name || "?")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="account-security-person-details">
                            <strong>{account.name || "—"}</strong>
                            <span>{account.email || "—"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="account-security-role">
                          {account.role || "—"}
                        </span>
                      </td>

                      <td>{account.joiningDate || "—"}</td>
                      <td>{account.employmentType || "—"}</td>
                      <td>{account.workLocation || "—"}</td>

                      <td>
                        <span
                          className={`account-security-status ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status || "UNKNOWN"}
                        </span>
                      </td>

                      <td>
                        {isInactive ? (
                          <span className="account-security-action-complete">
                            Inactive
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="account-security-inactive-button"
                            onClick={() => handleMarkInactive(account)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? "Processing..." : "Mark Inactive"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="account-security-panel-footer">
          <span>
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </span>
          <span>Permanent ADMIN account excluded</span>
        </div>
      </section>
    </div>
  );
}

export default AccountSecurity;
