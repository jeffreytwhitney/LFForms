

CREATE VIEW [dbo].[qryActiveUsers]
AS
SELECT    TOP 100 percent     tblUser.ID, tblUser.UserTypeID as UserType, tblUser.SiteID, tblUser.DepartmentID, tblUser.EmployeeNumber, tblUser.EMailAddress, tblUser.NetworkUserName, tblUser.IsAdmin, tblUser.IsActive, tblUser.FName, tblUser.LName, tblUser.LName + N', ' + tblUser.FName AS EmployeeName
FROM            tblUser 
WHERE        (tblUser.IsActive = 1)