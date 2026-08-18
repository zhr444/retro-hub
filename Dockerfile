FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY RetroHub.Api/ ./RetroHub.Api/
WORKDIR /app/RetroHub.Api

RUN dotnet restore
RUN dotnet publish -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "RetroHub.Api.dll"]