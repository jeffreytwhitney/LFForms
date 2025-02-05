CREATE VIEW [dbo].[qryProjectHistory]
AS
SELECT        TOP (100) PERCENT dbo.tblAudit_Project.ID, dbo.tblAudit_Project.ProjectID, dbo.tblAudit_Project.RecordEventType, dbo.tblAudit_Project.ProjectName, dbo.tblAudit_Project.ProjectDescription, dbo.tblDepartment.DepartmentName, 
                         O1.LName + ', ' + O1.FName AS PrimaryOwnerName, dbo.tblAudit_Project.CountOfActiveProjects, O2.LName + ', ' + O2.FName AS SecondaryOwnerName, O3.LName + ', ' + O3.FName AS TertiaryOwnerName, 
                         dbo.tblAudit_Project.CreatedTimestamp, dbo.tblUser.FName + ' ' + dbo.tblUser.LName AS LastUpdatedBy
FROM            dbo.tblUser INNER JOIN
                         dbo.tblUser AS O1 RIGHT OUTER JOIN
                         dbo.tblAudit_Project LEFT OUTER JOIN
                         dbo.tblUser AS O2 ON dbo.tblAudit_Project.SecondaryProjectOwnerID = O2.ID LEFT OUTER JOIN
                         dbo.tblUser AS O3 ON dbo.tblAudit_Project.TertiaryProjectOwnerID = O3.ID INNER JOIN
                         dbo.tblDepartment ON dbo.tblAudit_Project.DepartmentID = dbo.tblDepartment.ID ON O1.ID = dbo.tblAudit_Project.PrimaryProjectOwnerID ON dbo.tblUser.EmployeeNumber = dbo.tblAudit_Project.UpdateUserID
ORDER BY dbo.tblAudit_Project.ProjectName, dbo.tblAudit_Project.CreatedTimestamp