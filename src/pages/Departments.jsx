import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/DepartmentManagement.css";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [editDepartmentId, setEditDepartmentId] = useState(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("list");
  const [newDepartmentName, setNewDepartmentName] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleViewDepartment = async (departmentId) => {
    try {
      const response = await api.get(`/departments/${departmentId}`);

      alert(
        `Department ID: ${response.data.id}\nDepartment Name: ${response.data.name}`,
      );
    } catch (error) {
      console.error("Failed to view department:", error);
      setError("Failed to load department details.");
    }
  };

  const handleEditDepartment = (department) => {
    setEditDepartmentId(department.id);
    setEditDepartmentName(department.name);
  };

  const handleAddDepartment = async () => {
    try {
      await api.post("/departments", {
        name: newDepartmentName,
      });

      setNewDepartmentName("");
      await loadDepartments();

      setSuccess("Department added successfully.");
    } catch (error) {
      console.error("Failed to add department:", error);
      setError("Failed to add department.");
    }
  };

  const handleSaveDepartment = async (departmentId) => {
    try {
      await api.put(`/departments/${departmentId}`, {
        name: editDepartmentName,
      });

      setEditDepartmentId(null);
      setEditDepartmentName("");

      await loadDepartments();

      setSuccess("Department updated successfully.");
    } catch (error) {
      console.error("Failed to update department:", error);
      setError("Failed to update department.");
    }
  };

  const loadDepartments = async () => {
    try {
      setError("");

      const response = await api.get("/departments");

      setDepartments(response.data.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error("Failed to load departments:", error);
      setError("Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="department-page">
      <div className="department-page-header">
        <h1>Departments</h1>
        <p>Manage and maintain organization departments.</p>
      </div>

      <div className="department-tabs">
        <button
          type="button"
          className={activeSection === "list" ? "active" : ""}
          onClick={() => setActiveSection("list")}
        >
          Department List
        </button>

        <button
          type="button"
          className={activeSection === "add" ? "active" : ""}
          onClick={() => setActiveSection("add")}
        >
          Add Department
        </button>
      </div>

      {success && (
        <div className="department-success-notification">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {loading && <p>Loading departments...</p>}

      {error && <p>{error}</p>}

      {activeSection === "list" && !loading && !error && (
        <div className="department-card">
          <table className="department-table">
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
                  <td className="department-id">{department.id}</td>
                  <td className="department-name">
                    {editDepartmentId === department.id ? (
                      <input
                        type="text"
                        className="department-edit-input"
                        value={editDepartmentName}
                        onChange={(event) =>
                          setEditDepartmentName(event.target.value)
                        }
                      />
                    ) : (
                      department.name
                    )}
                  </td>

                  <td className="department-actions">
                    <button
                      type="button"
                      className="department-action-button"
                      onClick={() => handleViewDepartment(department.id)}
                    >
                      View
                    </button>
                    {editDepartmentId === department.id ? (
                      <button
                        type="button"
                        className="department-save-button"
                        onClick={() => handleSaveDepartment(department.id)}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="department-edit-button"
                        onClick={() => handleEditDepartment(department)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "add" && (
        <div className="department-add-section">
          <h2>Add Department</h2>
          <p>Create a new department for the organization.</p>

          <div className="department-add-form">
            <div className="department-form-group">
              <label>Department Name</label>
              <input
                type="text"
                placeholder="Enter department name"
                value={newDepartmentName}
                onChange={(event) => setNewDepartmentName(event.target.value)}
              />
            </div>

            <button type="button" onClick={handleAddDepartment}>
              Add Department
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
