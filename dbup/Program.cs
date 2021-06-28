using System;
using System.Linq;
using System.Reflection;
using DbUp;
using DbUp.Engine;

namespace dbup
{
  internal class Program
  {
    private static int Main(string[] args)
    {
      var connectionString =
						args.FirstOrDefault()
						?? "Server=127.0.0.1;Database=hwua;Port=5432;User Id=postgres;Password=password;";
						
      var upgrader = DeployChanges.To
            .PostgresqlDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
            .LogToConsole()
            .Build();
      var result = upgrader.PerformUpgrade();

      if (!result.Successful)
      {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(result.Error);
        Console.ResetColor();
#if DEBUG
        Console.ReadLine();
#endif                
        return -1;
      }

      Console.ForegroundColor = ConsoleColor.Green;
      Console.WriteLine("Success!");
      Console.ResetColor();
      return 0;
    }
  }
}