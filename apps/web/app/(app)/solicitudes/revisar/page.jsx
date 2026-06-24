"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { solicitudesApi } from "@/lib/api";

const estados = ["", "En Curso", "Finalizada", "Rechazada"];

export default function RevisarSolicitudesPage() {
  const [filters, setFilters] = useState({ rut: "", estado: "", fechaDesde: "", fechaHasta: "", centroId: "" });
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSolicitudes(nextFilters = filters) {
    setError("");
    setLoading(true);
    try {
      const data = await solicitudesApi.listar(nextFilters);
      setSolicitudes(data.solicitudes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSolicitudes();
  }, []);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadSolicitudes(filters);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Revisar solicitudes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Listado filtrable de solicitudes registradas en la base local.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Consulta por RUT, estado, fechas y centro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-5" onSubmit={handleSubmit}>
            <Field label="RUT">
              <Input value={filters.rut} onChange={(event) => updateFilter("rut", event.target.value)} />
            </Field>
            <Field label="Estado">
              <Select value={filters.estado} onChange={(event) => updateFilter("estado", event.target.value)}>
                {estados.map((estado) => (
                  <option key={estado || "todos"} value={estado}>
                    {estado || "Todos"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Desde">
              <Input type="date" value={filters.fechaDesde} onChange={(event) => updateFilter("fechaDesde", event.target.value)} />
            </Field>
            <Field label="Hasta">
              <Input type="date" value={filters.fechaHasta} onChange={(event) => updateFilter("fechaHasta", event.target.value)} />
            </Field>
            <Field label="Centro">
              <Input value={filters.centroId} onChange={(event) => updateFilter("centroId", event.target.value)} />
            </Field>
            <div className="md:col-span-5">
              <Button disabled={loading}>
                <Filter size={16} />
                {loading ? "Consultando..." : "Aplicar filtros"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes</CardTitle>
          <CardDescription>Maximo 100 registros ordenados por fecha de inicio.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">RUT usuario</th>
                  <th className="px-3 py-2 font-medium">Usuario</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Motivo</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Centro</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>
                      No hay solicitudes para los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((solicitud) => (
                    <tr key={solicitud.id_solicitud} className="border-t">
                      <td className="px-3 py-3 font-medium">{solicitud.id_solicitud}</td>
                      <td className="px-3 py-3">{new Date(solicitud.fecha_inicio).toLocaleString("es-CL")}</td>
                      <td className="px-3 py-3">{solicitud.rut_usuario}</td>
                      <td className="px-3 py-3">
                        {solicitud.usuario?.nombre} {solicitud.usuario?.apellido}
                      </td>
                      <td className="px-3 py-3">{solicitud.tipoSolicitud?.nombre_tipo_solicitud}</td>
                      <td className="px-3 py-3">{solicitud.motivo?.nombre_motivo}</td>
                      <td className="px-3 py-3">
                        <Badge variant={solicitud.estado_solicitud === "En Curso" ? "warning" : "muted"}>
                          {solicitud.estado_solicitud}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">{solicitud.centro_id || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
