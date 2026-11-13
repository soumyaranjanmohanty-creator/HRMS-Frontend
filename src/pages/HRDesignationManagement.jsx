import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/HRDesignationManagement.css";

function HRDesignationManagement() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [newDesignationName, setNewDesignationName] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [editDesignationId, setEditDesignationId] = useState(null);
  const [editDesignationName, setEditDesignationName] = useState("");

  const handleAddDesignation = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!newDesignationName.trim()) {
      setError("Please enter a designation name.");
      return;
    }

    if (!newDepartmentId) {
      setError("Please select a department.");
      return;
    }

    try {
      const payload = {
        name: newDesignationName.trim(),
        department: {
          id: Number(newDepartmentId),
        },
      };

      if (editDesignationId !== null) {
        await api.put(`/designations/${editDesignationId}`, payload);
        setSuccess("Designation updated successfully.");
      } else {
        await api.post("/designations", payload);
        setSuccess("Designation added successfully.");
      }

      const response = await api.get("/designations");

      setDesignations(response.data.sort((a, b) => a.id - b.id));

      setNewDesignationName("");
      setNewDepartmentId("");
      setEditDesignationId(null);
      setActiveTab("list");
    } catch (err) {
      console.error("Failed to save designation:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save designation. Please try again.",
      );
    }
  };

  const handleEditDesignation = (designation) => {
    setEditDesignationId(designation.id);
    setEditDesignationName(
      designation.name ?? designation.designationName ?? "",
    );
    setError("");
    setSuccess("");
  };

  const handleSaveDesignation = async (designationId) => {
    const name = editDesignationName.trim();

    if (!name) {
      setError("Designation name cannot be empty.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.put(`/designations/${designationId}`, {
        name,
      });

      const response = await api.get("/designations");

      setDesignations(response.data.sort((a, b) => a.id - b.id));

      setEditDesignationId(null);
      setEditDesignationName("");
      setSuccess("Designation name updated successfully.");
    } catch (err) {
      console.error("Failed to update designation:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update designation name. Please try again.",
      );
    }
  };

  const cancelEdit = () => {
    setEditDesignationId(null);
    setEditDesignationName("");
    setError("");
  };

  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [designationResponse, departmentResponse] = await Promise.all([
          api.get("/designations"),
          api.get("/departments"),
        ]);

        setDesignations(designationResponse.data.sort((a, b) => a.id - b.id));

        setDepartments(departmentResponse.data.sort((a, b) => a.id - b.id));
      } catch (err) {
        console.error("Failed to load designation data:", err);
        setError("Failed to load designation data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDepartmentName = (designation) => {
    if (designation.department?.name) {
      return designation.department.name;
    }

    if (designation.department?.departmentName) {
      return designation.department.departmentName;
    }

    if (designation.departmentName) {
      return designation.departmentName;
    }

    const departmentId =
      designation.department?.id ??
      designation.departmentId ??
      designation.department?.departmentId;

    const department = departments.find(
      (item) => String(item.id ?? item.departmentId) === String(departmentId),
    );

    return department?.name ?? department?.departmentName ?? "Not Assigned";
  };

  return (
    <div className="hr-designation-page">
      <div className="hr-designation-header">
        <div>
          <h1>Designation Management</h1>
          <p>Manage designations and their department assignments.</p>
        </div>
      </div>

      <div className="hr-designation-tabs">
        <button
          type="button"
          className={`hr-designation-tab ${
            activeTab === "list" ? "active" : ""
          }`}
          onClick={() => setActiveTab("list")}
        >
          Designation List
        </button>

        <button
          type="button"
          className={`hr-designation-tab ${
            activeTab === "add" ? "active" : ""
          }`}
          onClick={() => setActiveTab("add")}
        >
          Add Designation
        </button>

        <button
          type="button"
          className={`hr-designation-tab ${
            activeTab === "overview" ? "active" : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Designation Overview
        </button>
      </div>

      <div className="hr-designation-content">
        {success && <div className="hr-designation-success">✓ {success}</div>}

        {error && <div className="hr-designation-error">{error}</div>}
        {activeTab === "list" && (
          <div className="hr-designation-list">
            <div className="hr-designation-section-header">
              <div>
                <h2>Designation List</h2>
                <p>View all designations and their associated departments.</p>
              </div>

              <span className="hr-designation-count">
                Total: {designations.length}
              </span>
            </div>

            {loading ? (
              <p className="hr-designation-message">Loading designations...</p>
            ) : error ? (
              <p className="hr-designation-error">{error}</p>
            ) : designations.length === 0 ? (
              <p className="hr-designation-message">No designations found.</p>
            ) : (
              <div className="hr-designation-table-wrapper">
                <table className="hr-designation-table">
                  <thead>
                    <tr>
                      <th>Designation ID</th>
                      <th>Designation Name</th>
                      <th>Department</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {designations.map((designation) => (
                      <tr key={designation.designationId ?? designation.id}>
                        <td>
                          {designation.designationId ?? designation.id ?? "—"}
                        </td>

                        <td>
                          {editDesignationId === designation.id ? (
                            <input
                              type="text"
                              value={editDesignationName}
                              onChange={(event) =>
                                setEditDesignationName(event.target.value)
                              }
                              className="hr-designation-edit-input"
                              placeholder="Enter designation name"
                            />
                          ) : (
                            (designation.designationName ??
                            designation.name ??
                            "—")
                          )}
                        </td>

                        <td>{getDepartmentName(designation)}</td>

                        <td className="hr-designation-actions">
                          <button
                            type="button"
                            className="hr-designation-view-button"
                            onClick={() => {
                              setSelectedDesignation(designation);
                              setActiveTab("overview");
                            }}
                          >
                            View
                          </button>

                          {editDesignationId === designation.id ? (
                            <>
                              <button
                                type="button"
                                className="hr-designation-save-button"
                                onClick={() =>
                                  handleSaveDesignation(designation.id)
                                }
                              >
                                Save
                              </button>

                              <button
                                type="button"
                                className="hr-designation-edit-button"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="hr-designation-edit-button"
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
          </div>
        )}

        {activeTab === "add" && (
          <div className="hr-designation-add">
            <div className="hr-designation-section-header">
              <div>
                <h2>Add Designation</h2>
                <p>Create a new designation and assign it to a department.</p>
              </div>
            </div>

            <form
              className="hr-designation-form"
              onSubmit={handleAddDesignation}
            >
              <div className="hr-designation-form-group">
                <label htmlFor="designationName">Designation Name</label>
                <input
                  id="designationName"
                  type="text"
                  placeholder="Enter designation name"
                  value={newDesignationName}
                  onChange={(event) =>
                    setNewDesignationName(event.target.value)
                  }
                />
              </div>

              <div className="hr-designation-form-group">
                <label htmlFor="designationDepartment">Department</label>
                <select
                  id="designationDepartment"
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

              <button type="submit" className="hr-designation-save-button">
                Save Designation
              </button>
            </form>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="hr-designation-overview">
            <div className="hr-designation-section-header">
              <div>
                <h2>Designation Overview</h2>
                <p>View details of the selected designation.</p>
              </div>

              <button
                type="button"
                className="hr-designation-back-button"
                onClick={() => setActiveTab("list")}
              >
                Back to Designation List
              </button>
            </div>

            {selectedDesignation ? (
              <div className="hr-designation-details">
                <div className="hr-designation-detail-item">
                  <span>Designation ID</span>
                  <strong>
                    {selectedDesignation.id ??
                      selectedDesignation.designationId ??
                      "—"}
                  </strong>
                </div>

                <div className="hr-designation-detail-item">
                  <span>Designation Name</span>
                  <strong>
                    {selectedDesignation.name ??
                      selectedDesignation.designationName ??
                      "—"}
                  </strong>
                </div>

                <div className="hr-designation-detail-item">
                  <span>Department</span>
                  <strong>{getDepartmentName(selectedDesignation)}</strong>
                </div>
              </div>
            ) : (
              <p className="hr-designation-message">
                Select a designation from the Designation List to view its
                details.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HRDesignationManagement;
