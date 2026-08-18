FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Копируем исходники бэкенда
COPY RetroHub.Api/ ./RetroHub.Api/
WORKDIR /app/RetroHub.Api

# Собираем проект
RUN dotnet restore
RUN dotnet publish -c Release -o /out

# Финальный образ для запуска
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .

# Заставляем сервер слушать стандартный порт 80
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

# Правильная команда для запуска DLL
ENTRYPOINT ["dotnet", "RetroHub.Api.dll"]