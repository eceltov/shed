using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Configuration
{
    internal static class EnvironmentVariables
    {
        public static readonly string ConfigurationPath = Environment.GetEnvironmentVariable("PATH_TO_CONFIG") ?? "./dev/volumes/Configuration/config.json";
        public static readonly string DataPath = Environment.GetEnvironmentVariable("PATH_TO_DATA") ?? "./dev/volumes/Data/";
    }
}
