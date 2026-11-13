import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRDepartmentManagement.css";

function HRDepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);

  const [activeTab, setActiveTab] = useState("list");
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/departments");

      const data = Array.isArray(response.data) ? response.data : [];

      setDepartments(data.sort((a, b) => a.id - b.id));
    } catch (err) {
      console.error("Failed to load departments:", err);
      setError("Failed to load departments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDepartment = async (department) => {
    setError("");
    setSuccess("");
    setSelectedDepartment(null);
    setActiveTab("overview");
    setLoading(true);

    try {
      const [
        departmentResponse,
        designationResponse,
        employeeResponse,
        managerResponse,
      ] = await Promise.all([
        api.get(`/departments/${department.id}`),
        api.get("/designations"),
        api.get("/users/role/EMPLOYEE"),
        api.get("/users/role/MANAGER"),
      ]);

      setSelectedDepartment(departmentResponse.data);

      setDesignations(
        Array.isArray(designationResponse.data) ? designationResponse.data : [],
      );

      setEmployees(
        Array.isArray(employeeResponse.data) ? employeeResponse.data : [],
      );

      setManagers(
        Array.isArray(managerResponse.data) ? managerResponse.data : [],
      );
    } catch (err) {
      console.error("Failed to load department overview:", err);
      setError(
        "Unable to load all department details. Check your access permissions and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (event) => {
    event.preventDefault();

    const name = newDepartmentName.trim();

    if (!name) {
      setError("Please enter a department name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/departments", { name });

      setNewDepartmentName("");
      await loadDepartments();

      setActiveTab("list");
      setSuccess("Department added successfully.");
    } catch (err) {
      console.error("Failed to add department:", err);

      setError(
        err.response?.data?.message ||
          "Failed to add department. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditDepartment = (department) => {
    setEditDepartmentId(department.id);
    setEditDepartmentName(department.name);
    setError("");
    setSuccess("");
  };

  const handleSaveDepartment = async (departmentId) => {
    const name = editDepartmentName.trim();

    if (!name) {
      setError("Department name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/departments/${departmentId}`, { name });

      setEditDepartmentId(null);
      setEditDepartmentName("");

      await loadDepartments();

      if (selectedDepartment?.id === departmentId) {
        const response = await api.get(`/departments/${departmentId}`);
        setSelectedDepartment(response.data);
      }

      setSuccess("Department updated successfully.");
    } catch (err) {
      console.error("Failed to update department:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update department. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditDepartmentId(null);
    setEditDepartmentName("");
    setError("");
  };

  const getDepartmentId = (item) =>
    item?.departmentId ??
    item?.department?.id ??
    item?.department?.departmentId;

  const departmentId = selectedDepartment?.id;

  const departmentDesignations = designations.filter(
    (item) => Number(getDepartmentId(item)) === Number(departmentId),
  );

  const departmentEmployees = employees.filter(
    (item) => Number(getDepartmentId(item)) === Number(departmentId),
  );

  const departmentManagers = managers.filter(
    (item) => Number(getDepartmentId(item)) === Number(departmentId),
  );

  return (
    <div className="hr-department-page">
      <header className="hr-department-header">
        <div>
          <h1>Department Management</h1>
          <p>View, organize, and maintain organization departments.</p>
        </div>

        <div className="hr-department-total">
          <span>Total Departments</span>
          <strong>{departments.length}</strong>
        </div>
      </header>

      <nav className="hr-department-tabs">
        <button
          type="button"
          className={activeTab === "list" ? "active" : ""}
          onClick={() => {
            setActiveTab("list");
            setError("");
            setSuccess("");
          }}
        >
          Department List
        </button>

        <button
          type="button"
          className={activeTab === "add" ? "active" : ""}
          onClick={() => {
            setActiveTab("add");
            setError("");
            setSuccess("");
          }}
        >
          Add Department
        </button>

        <button
          type="button"
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => {
            setActiveTab("overview");
            setError("");
            setSuccess("");
          }}
        >
          Department Overview
        </button>
      </nav>

      {success && (
        <div className="hr-department-alert success" role="status">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="hr-department-alert error" role="alert">
          {error}
        </div>
      )}

      {activeTab === "list" && (
        <section className="hr-department-card">
          <div className="hr-department-card-header">
            <div>
              <h2>Department List</h2>
              <p>View and update existing department information.</p>
            </div>

            <button
              type="button"
              className="hr-department-primary-button"
              onClick={() => setActiveTab("add")}
            >
              + Add Department
            </button>
          </div>

          {loading ? (
            <p className="hr-department-message">Loading departments...</p>
          ) : (
            <div className="hr-department-table-wrapper">
              <table className="hr-department-table">
                <thead>
                  <tr>
                    <th>Department ID</th>
                    <th>Department Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td>{department.id}</td>

                      <td>
                        {editDepartmentId === department.id ? (
                          <input
                            type="text"
                            value={editDepartmentName}
                            onChange={(event) =>
                              setEditDepartmentName(event.target.value)
                            }
                            aria-label="Department name"
                          />
                        ) : (
                          department.name
                        )}
                      </td>

                      <td className="hr-department-actions">
                        <button
                          type="button"
                          className="hr-department-view-button"
                          onClick={() => handleViewDepartment(department)}
                          disabled={saving}
                        >
                          View Details
                        </button>

                        {editDepartmentId === department.id ? (
                          <>
                            <button
                              type="button"
                              className="hr-department-save-button"
                              onClick={() =>
                                handleSaveDepartment(department.id)
                              }
                              disabled={saving}
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>

                            <button
                              type="button"
                              className="hr-department-cancel-button"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="hr-department-edit-button"
                            onClick={() => handleEditDepartment(department)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {departments.length === 0 && (
                    <tr>
                      <td colSpan="3" className="hr-department-empty">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "add" && (
        <section className="hr-department-card hr-department-add-card">
          <h2>Add Department</h2>
          <p>Create a new department for the organization.</p>

          <form onSubmit={handleAddDepartment}>
            <div className="hr-department-form-group">
              <label htmlFor="hr-department-name">Department Name</label>

              <input
                id="hr-department-name"
                type="text"
                placeholder="Enter department name"
                value={newDepartmentName}
                onChange={(event) => setNewDepartmentName(event.target.value)}
                required
              />
            </div>

            <div className="hr-department-form-actions">
              <button
                type="submit"
                className="hr-department-primary-button"
                disabled={saving}
              >
                {saving ? "Adding..." : "Add Department"}
              </button>

              <button
                type="button"
                className="hr-department-cancel-button"
                onClick={() => {
                  setNewDepartmentName("");
                  setError("");
                }}
                disabled={saving}
              >
                Clear
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "overview" && (
        <section className="hr-department-card">
          <div className="hr-department-card-header">
            <div>
              <h2>Department Overview</h2>
              <p>Review department information and related records.</p>
            </div>

            <button
              type="button"
              className="hr-department-secondary-button"
              onClick={() => setActiveTab("list")}
            >
              Back to Department List
            </button>
          </div>

          {loading ? (
            <p className="hr-department-message">
              Loading department overview...
            </p>
          ) : !selectedDepartment ? (
            <div className="hr-department-empty-state">
              <h3>Select a Department</h3>
              <p>
                Open Department List and select View Details for a department.
              </p>

              <button
                type="button"
                className="hr-department-primary-button"
                onClick={() => setActiveTab("list")}
              >
                Open Department List
              </button>
            </div>
          ) : (
            <>
              <div className="hr-department-overview-grid">
                <div className="hr-department-info-card">
                  <span>Department ID</span>
                  <strong>{selectedDepartment.id}</strong>
                </div>

                <div className="hr-department-info-card">
                  <span>Department Name</span>
                  <strong>{selectedDepartment.name}</strong>
                </div>
              </div>

              <div className="hr-department-overview-section">
                <h3>Associated Designations</h3>

                {departmentDesignations.length > 0 ? (
                  <div className="hr-department-table-wrapper">
                    <table className="hr-department-table">
                      <thead>
                        <tr>
                          <th>Designation ID</th>
                          <th>Designation Name</th>
                        </tr>
                      </thead>

                      <tbody>
                        {departmentDesignations.map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="hr-department-message">
                    No associated designations were found in the available
                    designation data.
                  </p>
                )}
              </div>

              <div className="hr-department-overview-section">
                <h3>Department Managers</h3>

                <div className="hr-department-table-wrapper">
                  <table className="hr-department-table">
                    <thead>
                      <tr>
                        <th>Manager ID</th>
                        <th>Manager Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>

                    <tbody>
                      {departmentManagers.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                        </tr>
                      ))}

                      {departmentManagers.length === 0 && (
                        <tr>
                          <td colSpan="3" className="hr-department-empty">
                            No managers found for this department.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="hr-department-overview-section">
                <h3>Department Employees</h3>

                <div className="hr-department-table-wrapper">
                  <table className="hr-department-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Employee Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>

                    <tbody>
                      {departmentEmployees.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                        </tr>
                      ))}

                      {departmentEmployees.length === 0 && (
                        <tr>
                          <td colSpan="3" className="hr-department-empty">
                            No employees found for this department.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default HRDepartmentManagement;
