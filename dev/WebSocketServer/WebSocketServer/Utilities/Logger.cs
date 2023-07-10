using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Utilities
{
    internal static class Logger
    {
        static TextWriter? DefaultOut;
        static TextWriter? DebugOut;

        static Logger()
        {
            DefaultOut = Console.Out;
            DebugOut = null;
        }

        public static void SetDefaultOutput(TextWriter? output)
        {
            DefaultOut = output;
        }

        public static void SetDebugOutput(TextWriter? output)
        {
            DebugOut = output;
        }

        public static void WriteLine(string message)
        {
            DefaultOut?.WriteLine(message);
        }

        public static void DebugWriteLine(string message)
        {
            DebugOut?.WriteLine(message);
        }
    }
}
