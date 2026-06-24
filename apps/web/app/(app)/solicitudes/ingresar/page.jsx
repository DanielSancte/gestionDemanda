"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { solicitudesApi } from "@/lib/api";

const emptyForm = {
  rut_usuario: "",
  nombre_usuario: "",
  apellido_usuario: "",
  telefono: "",
  correo_contacto: "",
  tipo_solicitud_id: "",
  motivo_id: "",
  disponibilidad_llamada: "",
  priorizacion_admin: "",
  centro_id: "CENTRO-01",
  descripcion: ""
};

export default function IngresarSolicitudPage() {
  const [rutBusqueda, setRutBusqueda] = useState("");
  const [pendientes, setPendientes] = useState(null);
  const [catalogos, setCatalogos] = useState({ tiposSolicitud: [], motivos: [] });
  const [form, setForm] = useState(emptyForm);
  const [loadingPendientes, setLoadingPendientes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    solicitudesApi.catalogos().then(setCatalogos).catch((err) => setError(err.message));
  }, []);

  const motivosFiltrados = useMemo(() => {
    if (!form.tipo_solicitud_id) return catalogos.motivos;
    return catalogos.motivos.filter((motivo) => String(motivo.tipo_solicitud_id) === String(form.tipo_solicitud_id));
  }, [catalogos.motivos, form.tipo_solicitud_id]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "tipo_solicitud_id" ? { motivo_id: "" } : {})
    }));
  }

  async function buscarPendientes(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPendientes(null);
    setLoadingPendientes(true);
    try {
      const data = await solicitudesApi.pendientes(rutBusqueda);
      setPendientes(data);
      setForm((current) => ({ ...current, rut_usuario: rutBusqueda }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPendientes(false);
    }
  }

  async function crearSolicitud(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const { solicitud } = await solicitudesApi.crear(form);
      setMessage(`Solicitud creada: ${solicitud.id_solicitud}`);
      setForm({ ...emptyForm, rut_usuario: form.rut_usuario });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Ingresar solicitud</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Primero busca el RUT para informar solicitudes en curso y citas pendientes antes del registro.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revision previa</CardTitle>
          <CardDescription>Solicitudes pendientes: estado_solicitud En Curso. Citas pendientes: Sin llamadas, No contesta (1), No contesta (2).</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={buscarPendientes}>
            <Input
              placeholder="RUT usuario"
              value={rutBusqueda}
              onChange={(event) => setRutBusqueda(event.target.value)}
              required
            />
            <Button disabled={loadingPendientes}>
              <Search size={16} />
              {loadingPendientes ? "Buscando..." : "Buscar pendientes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {pendientes && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes pendientes</CardTitle>
              <CardDescription>Estado de solicitud En Curso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendientes.solicitudesPendientes.length === 0 ? (
                <EmptyState text="No hay solicitudes En Curso para este RUT." />
              ) : (
                pendientes.solicitudesPendientes.map((solicitud) => (
                  <PendingRow
                    key={solicitud.id_solicitud}
                    title={solicitud.id_solicitud}
                    badge={solicitud.estado_solicitud}
                    description={solicitud.descripcion || solicitud.motivo?.nombre_motivo}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Citas pendientes</CardTitle>
              <CardDescription>Estados de llamada pendientes definidos para la primera etapa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendientes.citasPendientes.length === 0 ? (
                <EmptyState text="No hay citas o llamadas pendientes para este RUT." />
              ) : (
                pendientes.citasPendientes.map((llamada) => (
                  <PendingRow
                    key={llamada.id_llamada}
                    title={llamada.id_llamada}
                    badge={llamada.respuesta_usuario}
                    description={llamada.observacion || llamada.solicitud?.descripcion}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nueva solicitud</CardTitle>
          <CardDescription>El estado inicial queda como En Curso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={crearSolicitud}>
            <Field label="RUT usuario">
              <Input value={form.rut_usuario} onChange={(event) => updateField("rut_usuario", event.target.value)} required />
            </Field>
            <Field label="Centro">
              <Input value={form.centro_id} onChange={(event) => updateField("centro_id", event.target.value)} />
            </Field>
            <Field label="Nombre">
              <Input value={form.nombre_usuario} onChange={(event) => updateField("nombre_usuario", event.target.value)} required />
            </Field>
            <Field label="Apellido">
              <Input value={form.apellido_usuario} onChange={(event) => updateField("apellido_usuario", event.target.value)} required />
            </Field>
            <Field label="Telefono">
              <Input value={form.telefono} onChange={(event) => updateField("telefono", event.target.value)} />
            </Field>
            <Field label="Correo contacto">
              <Input type="email" value={form.correo_contacto} onChange={(event) => updateField("correo_contacto", event.target.value)} />
            </Field>
            <Field label="Tipo solicitud">
              <Select value={form.tipo_solicitud_id} onChange={(event) => updateField("tipo_solicitud_id", event.target.value)} required>
                <option value="">Seleccionar</option>
                {catalogos.tiposSolicitud.map((tipo) => (
                  <option key={tipo.id_tipo_solicitud} value={tipo.id_tipo_solicitud}>
                    {tipo.nombre_tipo_solicitud}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Motivo">
              <Select value={form.motivo_id} onChange={(event) => updateField("motivo_id", event.target.value)} required>
                <option value="">Seleccionar</option>
                {motivosFiltrados.map((motivo) => (
                  <option key={motivo.id_motivo} value={motivo.id_motivo}>
                    {motivo.nombre_motivo}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Disponibilidad llamada">
              <Input
                value={form.disponibilidad_llamada}
                onChange={(event) => updateField("disponibilidad_llamada", event.target.value)}
                placeholder="Ej: manana AM"
              />
            </Field>
            <Field label="Priorizacion admin">
              <Input
                type="number"
                step="0.1"
                value={form.priorizacion_admin}
                onChange={(event) => updateField("priorizacion_admin", event.target.value)}
              />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Descripcion">
                <Textarea value={form.descripcion} onChange={(event) => updateField("descripcion", event.target.value)} />
              </Field>
            </div>
            {error && <p className="lg:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {message && <p className="lg:col-span-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">{message}</p>}
            <div className="lg:col-span-2">
              <Button disabled={submitting}>{submitting ? "Guardando..." : "Guardar solicitud"}</Button>
            </div>
          </form>
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

function EmptyState({ text }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <CheckCircle2 size={16} />
      {text}
    </div>
  );
}

function PendingRow({ title, badge, description }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description || "Sin observacion"}</p>
        </div>
        <Badge variant="warning">
          <AlertTriangle size={12} />
          {badge}
        </Badge>
      </div>
    </div>
  );
}
