import { Router } from "express";
import { createOrUpdate, deleteDashboard, getDashboard, listDashboards } from "../controller/dashboardController";

const dashboardRouter = Router()

dashboardRouter.get("/:id", getDashboard)
dashboardRouter.post("/:id", createOrUpdate)
dashboardRouter.get("/list", listDashboards)
dashboardRouter.get("/:id", deleteDashboard)
  

export default dashboardRouter