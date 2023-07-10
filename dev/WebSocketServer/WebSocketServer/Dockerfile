#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/runtime:6.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["WebSocketServer/WebSocketServer.csproj", "WebSocketServer/"]
RUN dotnet restore "WebSocketServer/WebSocketServer.csproj"
COPY . .
WORKDIR "/src/WebSocketServer"
RUN dotnet build "WebSocketServer.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "WebSocketServer.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WebSocketServer.dll"]