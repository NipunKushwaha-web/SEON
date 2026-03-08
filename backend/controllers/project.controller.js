import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';

// Helper to handle async controller errors
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(err => {
        console.error(err);
        if (res.headersSent) return;
        // Provide a consistent error shape
        res.status(400).json({ error: err.message || 'An error occurred' });
    });

export const createProject = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userId = loggedInUser._id;
    const newProject = await projectService.createProject({ name, userId });

    // Optionally wrap with { project: newProject } for consistency
    res.status(201).json({ project: newProject });
});

export const getAllProject = asyncHandler(async (req, res) => {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    const allUserProjects = await projectService.getAllProjectByUserId({
        userId: loggedInUser._id
    });

    return res.status(200).json({ projects: allUserProjects });
});

export const addUserToProject = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, users } = req.body;

    if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
    }
    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ error: 'users array is required and cannot be empty' });
    }

    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    const project = await projectService.addUsersToProject({
        projectId,
        users,
        userId: loggedInUser._id
    });

    return res.status(200).json({ project });
});

export const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await projectService.getProjectById({ projectId });
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ project });
});

export const updateFileTree = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, fileTree } = req.body;

    if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
    }

    if (!fileTree) {
        return res.status(400).json({ error: 'fileTree is required' });
    }

    const project = await projectService.updateFileTree({
        projectId,
        fileTree
    })

    if (!project) {
        return res.status(404).json({ error: 'Project not found or cannot update file tree' });
    }

    return res.status(200).json({ project });
});