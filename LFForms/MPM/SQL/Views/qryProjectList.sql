

CREATE VIEW [dbo].[qryProjectList]
AS
SELECT        dbo.tblProject.ID
						, dbo.tblProject.SiteID
						, dbo.tblProject.ProjectName
						, dbo.tblProject.ProjectDescription
						, dbo.tblDepartment.DepartmentName
						, dbo.tblProject.DepartmentID
						, dbo.tblProject.PrimaryProjectOwnerID
						, dbo.tblProject.TertiaryProjectOwnerID
						, dbo.tblProject.SecondaryProjectOwnerID
						, dbo.tblProject.CountOfActiveTasks
						, O2.LName + ', ' + O2.FName AS PrimaryOwnerName
						, O3.LName + ', ' + O3.FName AS SecondaryOwnerName
						, O4.LName + ', ' + O4.FName AS TertiaryOwnerName
						, O5.LName + ', ' + O5.FName AS InitiatorName
						, dbo.tblProject.InitiatorEmployeeID
						, dbo.tblProject.InitiatorEmailCarbonCopy
						,(Select Min(DueDate) as MinDueDate from tblTask where tblTask.ProjectID = tblProject.ID) AS MinDueDate
						,(Select Min(ScheduledDueDate) as MinScheduledDueDate from tblTask where tblTask.ProjectID = tblProject.ID) AS MinScheduledDueDate
						
FROM            dbo.tblProject 

LEFT OUTER JOIN dbo.tblDepartment ON dbo.tblDepartment.ID = dbo.tblProject.DepartmentID
LEFT OUTER JOIN dbo.tblUser AS O2 ON dbo.tblProject.PrimaryProjectOwnerID = O2.ID  
LEFT OUTER JOIN dbo.tblUser AS O3 ON dbo.tblProject.SecondaryProjectOwnerID = O3.ID 
LEFT OUTER JOIN dbo.tblUser AS O4 ON dbo.tblProject.TertiaryProjectOwnerID = O4.ID 
LEFT OUTER JOIN dbo.tblUser AS O5 ON dbo.tblProject.InitiatorEmployeeID = O5.ID