const noteService = require("../services/noteService");
const getNotes = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { relatedType, relatedTo } = req.query;
    const notes = await noteService.getNotes(organizationId, userId, { relatedType, relatedTo });
    res.status(200).json({
      success: true,
      message: "Notes fetched successfully",
      data: notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load notes",
    });
  }
};
const createNote = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const note = await noteService.createNote(organizationId, userId, req.body);
    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note,
    });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create note",
    });
  }
};
const updateNote = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const note = await noteService.updateNote(req.params.id, organizationId, userId, req.body);
    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update note",
    });
  }
};
const deleteNote = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await noteService.deleteNote(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to delete note",
    });
  }
};
module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
