import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/DesignationManagement.css";

function Designations() {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [editDesignationId, setEditDesignationId] = useState(null);
  const [editDesignationName, setEditDesignationName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeSection, setActiveSection] = useState("list");

  const [newDesignationName, setNewDesignationName] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState("");

  useEffect(() => {
    loadDesignations();
    loadDepartments();
  }, []);

  const loadDesignations = async () => {
    try {
      setError("");

      const response = await api.get("/designations");

      setDesignations(response.data.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error("Failed to load designations:", error);
      setError("Failed to load designations.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDesignation = async () => {
    try {
      await api.post("/designations", {
        name: newDesignationName,
        department: {
          id: Number(newDepartmentId),
        },
      });

      setNewDesignationName("");
      setNewDepartmentId("");

      await loadDesignations();

      setSuccess("Designation added successfully.");
    } catch (error) {
      console.error("Failed to add designation:", error);
      setError("Failed to add designation.");
    }
  };

  const handleSaveDesignation = async (designationId) => {
    try {
      await api.put(`/designations/${designationId}`, {
        name: editDesignationName,
        department: {
          id: Number(editDepartmentId),
        },
      });

      setEditDesignationId(null);
      setEditDesignationName("");
      setEditDepartmentId("");

      await loadDesignations();

      setSuccess("Designation updated successfully.");
    } catch (error) {
      console.error("Failed to update designation:", error);
      setError("Failed to update designation.");
    }
  };

  const handleEditDesignation = (designation) => {
    setError("");
    setSuccess("");

    setEditDesignationId(designation.id);
    setEditDesignationName(designation.name);
    setEditDepartmentId(designation.department?.id || "");
  };

  const handleViewDesignation = async (designationId) => {
    try {
      const response = await api.get(`/designations/${designationId}`);

      alert(
        `Designation ID: ${response.data.id}\n` +
          `Designation Name: ${response.data.name}\n` +
          `Department: ${response.data.department?.name || "-"}`,
      );
    } catch (error) {
      console.error("Failed to view designation:", error);
      setError("Failed to load designation details.");
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get("/departments");

      setDepartments(response.data.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error("Failed to load departments:", error);
      setError("Failed to load departments.");
    }
  };

  return (
    <div className="designation-page">
      <div className="designation-page-header">
        <h1>Designations</h1>
        <p>Manage and maintain organization designations.</p>
      </div>

      <div className="designation-tabs">
        <button
          type="button"
          className={activeSection === "list" ? "active" : ""}
          onClick={() => setActiveSection("list")}
        >
          Designation List
        </button>

        <button
          type="button"
          className={activeSection === "add" ? "active" : ""}
          onClick={() => setActiveSection("add")}
        >
          Add Designation
        </button>
      </div>

      {success && (
        <div className="designation-success-notification">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {loading && <p>Loading designations...</p>}

      {error && <p>{error}</p>}

      {activeSection === "list" && !loading && !error && (
        <div className="designation-card">
          <table className="designation-table">
            <thead>
              <tr>
                <th>Designation ID</th>
                <th>Designation Name</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {designations.map((designation) => (
                <tr key={designation.id}>
                  <td className="designation-id">{designation.id}</td>

                  <td className="designation-name">
                    {editDesignationId === designation.id ? (
                      <input
                        type="text"
                        className="designation-edit-input"
                        value={editDesignationName}
                        onChange={(event) =>
                          setEditDesignationName(event.target.value)
                        }
                      />
                    ) : (
                      designation.name
                    )}
                  </td>

                  <td className="designation-department">
                    {editDesignationId === designation.id ? (
                      <select
                        value={editDepartmentId}
                        onChange={(event) =>
                          setEditDepartmentId(event.target.value)
                        }
                      >
                        <option value="">Select Department</option>

                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      designation.department?.name || "-"
                    )}
                  </td>

                  <td className="designation-actions">
                    <button
                      type="button"
                      className="designation-edit-button"
                      onClick={() => handleViewDesignation(designation.id)}
                    >
                      View
                    </button>

                    {editDesignationId === designation.id ? (
                      <button
                        type="button"
                        className="designation-save-button"
                        onClick={() => handleSaveDesignation(designation.id)}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="designation-action-button"
                        onClick={() => handleEditDesignation(designation)}
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
        <div className="designation-add-section">
          <h2>Add Designation</h2>
          <p>Create a new designation for the organization.</p>

          <div className="designation-add-form">
            <div className="designation-form-group">
              <label>Designation Name</label>

              <input
                type="text"
                placeholder="Enter designation name"
                value={newDesignationName}
                onChange={(event) => setNewDesignationName(event.target.value)}
              />
            </div>

            <div className="designation-form-group">
              <label>Department</label>

              <select
                value={newDepartmentId}
                onChange={(event) => setNewDepartmentId(event.target.value)}
              >
                <option value="">Select Department</option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" onClick={handleAddDesignation}>
              Add Designation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Designations;
