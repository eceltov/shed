using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Parsers.ConfigurationParsers;

namespace WebSocketServer.Configuration
{
    internal static class ConfigurationManager
    {
        static ConfigurationManager()
        {
            using var sr = new StreamReader(EnvironmentVariables.ConfigurationPath);
            string jsonString = sr.ReadToEnd();
            Configuration = new AppConfigurationParser(jsonString);
        }

        public static AppConfigurationParser Configuration { get; private set; }
    }
}
