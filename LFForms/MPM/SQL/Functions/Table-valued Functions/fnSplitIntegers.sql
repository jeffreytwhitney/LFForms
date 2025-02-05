CREATE FUNCTION dbo.fnSplitIntegers  
(  
   @List      VARCHAR(MAX)  
)  
RETURNS TABLE  
AS  
  RETURN ( SELECT Item = CONVERT(INT, Item) FROM  
      ( SELECT Item = x.i.value('(./text())[1]', 'varchar(max)')  
        FROM ( SELECT [XML] = CONVERT(XML, '<i>'  
        + REPLACE(@List, ',', '</i><i>') + '</i>').query('.')  
          ) AS a CROSS APPLY [XML].nodes('i') AS x(i) ) AS y  
      WHERE Item IS NOT NULL  
  );