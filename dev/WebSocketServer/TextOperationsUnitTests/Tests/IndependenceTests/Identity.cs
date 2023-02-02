using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.Tests.IndependenceTests
{
    [TestClass]
    public class Identity
    {
        [TestMethod]
        public void AddAddAdd1()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Add(0, 1, "bc"), new Add(0, 3, "defg") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddAddAdd2()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Add(0, 0, "bc"), new Add(0, 0, "defg") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddAddAdd3()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Add(0, 0, "bc"), new Add(0, 1, "defg") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddDelAddDel1()
        {
            Dif testDif = new() { new Add(0, 0, "abcd"), new Del(0, 1, 2), new Add(0, 2, "ef"), new Del(0, 1, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddDelAddDel2()
        {
            Dif testDif = new() { new Add(0, 0, "abcd"), new Del(0, 1, 2), new Add(0, 1, "bc"), new Del(0, 0, 4) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddDelAddDel3()
        {
            Dif testDif = new() { new Add(0, 0, "abcd"), new Del(0, 0, 4), new Add(0, 0, "abcd"), new Del(0, 0, 4) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddDelAddDel4()
        {
            Dif testDif = new() { new Add(0, 0, "abcd"), new Del(0, 1, 2), new Add(0, 0, "abcd"), new Del(0, 1, 4) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineAdd1()
        {
            Dif testDif = new() { new Newline(0, 0), new Add(0, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineAdd2()
        {
            Dif testDif = new() { new Newline(1, 1), new Add(2, 1, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineAdd3()
        {
            Dif testDif = new() { new Newline(1, 0), new Add(0, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewline1()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewline2()
        {
            Dif testDif = new() { new Add(0, 0, "ab"), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewline3()
        {
            Dif testDif = new() { new Add(0, 0, "ab"), new Newline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewline4()
        {
            Dif testDif = new() { new Add(0, 0, "ab"), new Newline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewline5()
        {
            Dif testDif = new() { new Add(0, 0, "ab"), new Newline(0, 3) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewline6()
        {
            Dif testDif = new() { new Add(1, 0, "a"), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineDel1()
        {
            Dif testDif = new() { new Newline(0, 0), new Del(1, 1, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineDel2()
        {
            Dif testDif = new() { new Newline(2, 0), new Del(1, 1, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineDel3()
        {
            Dif testDif = new() { new Newline(0, 2), new Del(0, 0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineDel4()
        {
            Dif testDif = new() { new Newline(0, 2), new Del(0, 0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineDel5()
        {
            Dif testDif = new() { new Newline(0, 2), new Del(0, 1, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline1()
        {
            Dif testDif = new() { new Del(0, 0, 1), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline2()
        {
            Dif testDif = new() { new Del(0, 1, 1), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline3()
        {
            Dif testDif = new() { new Del(0, 0, 2), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline4()
        {
            Dif testDif = new() { new Del(0, 0, 1), new Newline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline5()
        {
            Dif testDif = new() { new Del(0, 0, 2), new Newline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline6()
        {
            Dif testDif = new() { new Del(0, 0, 2), new Newline(0, 5) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline7()
        {
            Dif testDif = new() { new Del(0, 0, 2), new Newline(1, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelNewline8()
        {
            Dif testDif = new() { new Del(0, 0, 2), new Newline(1, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd1()
        {
            Dif testDif = new() { new Remline(0, 0), new Add(0, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd2()
        {
            Dif testDif = new() { new Remline(0, 0), new Add(0, 0, "ab") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd3()
        {
            Dif testDif = new() { new Remline(0, 1), new Add(0, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd4()
        {
            Dif testDif = new() { new Remline(0, 1), new Add(0, 1, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd5()
        {
            Dif testDif = new() { new Remline(0, 1), new Add(0, 0, "ab") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd6()
        {
            Dif testDif = new() { new Remline(0, 1), new Add(0, 1, "ab") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd7()
        {
            Dif testDif = new() { new Remline(0, 0), new Add(1, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd8()
        {
            Dif testDif = new() { new Remline(0, 0), new Add(1, 1, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd9()
        {
            Dif testDif = new() { new Remline(1, 0), new Add(0, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd10()
        {
            Dif testDif = new() { new Remline(1, 0), new Add(0, 1, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd11()
        {
            Dif testDif = new() { new Remline(0, 2), new Add(1, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd12()
        {
            Dif testDif = new() { new Remline(0, 2), new Add(1, 1, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd13()
        {
            Dif testDif = new() { new Remline(0, 2), new Add(1, 0, "ab") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd14()
        {
            Dif testDif = new() { new Remline(0, 0), new Add(2, 0, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineAdd15()
        {
            Dif testDif = new() { new Remline(0, 0), new Add(2, 1, "a") };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline1()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Remline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline2()
        {
            Dif testDif = new() { new Add(0, 0, "ab"), new Remline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline3()
        {
            Dif testDif = new() { new Add(0, 1, "a"), new Remline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline4()
        {
            Dif testDif = new() { new Add(0, 1, "ab"), new Remline(0, 3) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline5()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Remline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline6()
        {
            Dif testDif = new() { new Add(0, 0, "ab"), new Remline(0, 5) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline7()
        {
            Dif testDif = new() { new Add(0, 1, "a"), new Remline(0, 5) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline8()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Remline(1, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline9()
        {
            Dif testDif = new() { new Add(0, 0, "a"), new Remline(1, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline10()
        {
            Dif testDif = new() { new Add(1, 0, "a"), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddRemline11()
        {
            Dif testDif = new() { new Add(1, 0, "a"), new Remline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel1()
        {
            Dif testDif = new() { new Remline(0, 1), new Del(0, 0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel2()
        {
            Dif testDif = new() { new Remline(0, 2), new Del(0, 0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel3()
        {
            Dif testDif = new() { new Remline(0, 2), new Del(0, 0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel4()
        {
            Dif testDif = new() { new Remline(1, 0), new Del(0, 0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel5()
        {
            Dif testDif = new() { new Remline(1, 1), new Del(0, 0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel6()
        {
            Dif testDif = new() { new Remline(0, 0), new Del(1, 0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel7()
        {
            Dif testDif = new() { new Remline(0, 1), new Del(1, 0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void RemlineDel8()
        {
            Dif testDif = new() { new Remline(0, 1), new Del(1, 1, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline1()
        {
            Dif testDif = new() { new Del(0, 0, 1), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline2()
        {
            Dif testDif = new() { new Del(0, 0, 1), new Remline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline3()
        {
            Dif testDif = new() { new Del(0, 0, 2), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline4()
        {
            Dif testDif = new() { new Del(0, 0, 2), new Remline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline5()
        {
            Dif testDif = new() { new Del(0, 0, 1), new Remline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline6()
        {
            Dif testDif = new() { new Del(0, 1, 1), new Remline(0, 4) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline7()
        {
            Dif testDif = new() { new Del(0, 0, 1), new Remline(1, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline8()
        {
            Dif testDif = new() { new Del(0, 0, 1), new Remline(1, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline9()
        {
            Dif testDif = new() { new Del(1, 0, 1), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline10()
        {
            Dif testDif = new() { new Del(1, 0, 1), new Remline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline11()
        {
            Dif testDif = new() { new Del(1, 1, 1), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void DelRemline12()
        {
            Dif testDif = new() { new Del(1, 1, 1), new Remline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineNewline1()
        {
            Dif testDif = new() { new Newline(0, 0), new Newline(0, 0), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineNewline2()
        {
            Dif testDif = new() { new Newline(0, 0), new Newline(1, 0), new Newline(2, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineNewline3()
        {
            Dif testDif = new() { new Newline(2, 0), new Newline(1, 0), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineNewline4()
        {
            Dif testDif = new() { new Newline(1, 0), new Newline(1, 0), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineNewline5()
        {
            Dif testDif = new() { new Newline(2, 0), new Newline(1, 0), new Newline(2, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineNewline6()
        {
            Dif testDif = new() { new Newline(1, 0), new Newline(2, 0), new Newline(1, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineNewline7()
        {
            Dif testDif = new() { new Newline(2, 0), new Newline(2, 0), new Newline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineAddNewline1()
        {
            Dif testDif = new() { new Add(0, 0, "1212"), new Newline(0, 2), new Add(1, 2, "34"), new Newline(1, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineAddNewline2()
        {
            Dif testDif = new() { new Add(0, 0, "1212"), new Newline(0, 2), new Add(0, 1, "ab"), new Newline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineAddNewline3()
        {
            Dif testDif = new() { new Add(0, 0, "1234"), new Newline(0, 4), new Add(1, 0, "1234"), new Newline(1, 4) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineAddNewline4()
        {
            Dif testDif = new() { new Add(0, 0, "1212"), new Newline(0, 2), new Add(1, 1, "ab"), new Newline(1, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineAddNewline5()
        {
            Dif testDif = new() { new Add(0, 0, "1234"), new Newline(0, 4), new Add(0, 4, "5678"), new Newline(0, 8) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineAddNewline6()
        {
            Dif testDif = new() { new Add(0, 0, "1231"), new Newline(0, 3), new Add(0, 3, "4561"), new Newline(0, 6) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline1()
        {
            Dif testDif = new() { new Newline(0, 0), new Newline(0, 0), new Remline(0, 0), new Newline(0, 0), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline2()
        {
            Dif testDif = new() { new Newline(1, 0), new Newline(0, 0), new Remline(0, 0), new Newline(0, 0), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline3()
        {
            Dif testDif = new() { new Newline(0, 0), new Newline(1, 0), new Remline(2, 0), new Newline(1, 0), new Remline(1, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline4()
        {
            Dif testDif = new() { new Newline(0, 0), new Newline(0, 0), new Remline(0, 0), new Newline(3, 0), new Remline(3, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline5()
        {
            Dif testDif = new() { new Newline(7, 0), new Newline(7, 0), new Remline(2, 0), new Newline(1, 0), new Remline(3, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline6()
        {
            Dif testDif = new() { new Newline(1, 0), new Newline(3, 0), new Remline(5, 0), new Newline(2, 0), new Remline(4, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline7()
        {
            Dif testDif = new() { new Newline(5, 0), new Newline(4, 0), new Remline(3, 0), new Newline(2, 0), new Remline(1, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline8()
        {
            Dif testDif = new() { new Newline(0, 2), new Newline(0, 2), new Remline(1, 0), new Newline(1, 4), new Remline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline9()
        {
            Dif testDif = new() { new Newline(0, 2), new Newline(1, 2), new Remline(1, 2), new Newline(1, 2), new Remline(1, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void NewlineNewlineRemlineNewlineRemline10()
        {
            Dif testDif = new() { new Newline(0, 1), new Newline(0, 1), new Remline(0, 1), new Newline(0, 1), new Remline(0, 1) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineNewlineNewlineDelRemline1()
        {
            Dif testDif = new() { new Add(0, 0, "12345678"), new Newline(0, 2), new Newline(1, 2), new Newline(2, 2), new Del(1, 0, 2), new Remline(0, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineNewlineNewlineDelRemline2()
        {
            Dif testDif = new() { new Add(0, 0, "12345678"), new Newline(0, 6), new Newline(0, 4), new Newline(0, 2), new Del(3, 0, 2), new Remline(2, 2) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineNewlineNewlineDelRemline3()
        {
            Dif testDif = new() { new Add(0, 1, "23456789"), new Newline(0, 2), new Newline(0, 2), new Newline(0, 2), new Del(0, 0, 2), new Remline(0, 0) };
            DifAssertions.TestIndepDep(testDif);
        }

        [TestMethod]
        public void AddNewlineNewlineNewlineDelRemline4()
        {
            Dif testDif = new() { new Add(1, 1, "23456789"), new Newline(0, 2), new Newline(0, 2), new Newline(3, 2), new Del(3, 0, 2), new Remline(2, 0) };
            DifAssertions.TestIndepDep(testDif);
        }
    }
}
