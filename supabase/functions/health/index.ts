Deno.serve(() => {
  return Response.json({
    ok: true,
    service: "health",
  });
});
