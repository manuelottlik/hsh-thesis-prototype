# Prototyp für die Master-Thesis "Event-Driven Microservices – eine Antwort auf gestiegene Integrationsbedarfe zunehmend verteilter Systeme?" an der Hochschule Hannover

Dieses README erklärt nicht den kompletten Aufbau dieses Prototyps. Für eine vollständige Erläuterung ist die [Master-Thesis](https://doi.org/10.25968/opus-2139) heranzuziehen.

## Erläuterung der Ordner-Struktur

| Ordner              | Beschreibung                                                                       |
| ------------------- | ---------------------------------------------------------------------------------- |
| `.deploy`           | Kubernetes-Ressourcen, die von ArgoCD ausgeliefert werden.                         |
| `.github/workflows` | CI/CD Workflow, der alle Services baut und in die Docker-Registry von GitHub legt. |
| `src`               | Services des Prototyps.                                                            |
| `src/asyncapi`      | AsyncAPI-Beschreibungen aller Services.                                            |
| `src/helpers`       | Hilfs-Bibliotheken für die Services.                                               |
| `src/openapi`       | OpenAPI-Beschreibung aller Services.                                               |
