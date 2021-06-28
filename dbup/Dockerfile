FROM mcr.microsoft.com/dotnet/sdk:5.0
WORKDIR /build
COPY dbup.csproj ./
RUN dotnet restore 
COPY . .
RUN dotnet publish -o /publish 
WORKDIR /publish 
CMD ["sh", "-c", "dotnet dbup.dll \"${DB_CONNECTION}\""]