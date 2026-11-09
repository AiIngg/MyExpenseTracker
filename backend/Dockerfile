
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["backend.csproj", "./"]

RUN dotnet restore "backend.csproj"

COPY . .

RUN dotnet publish "backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "dotnet backend.dll --urls http://0.0.0.0:${PORT:-10000}"]
