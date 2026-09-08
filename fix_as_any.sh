for file in src/actions/audits.ts src/actions/evidence.ts src/actions/findings.ts src/actions/risks.ts; do
  sed -i 's/membership.role as any/membership.role as Role/g' "$file"
  # also make sure Role is imported
  if ! grep -q "type Role" "$file" && ! grep -q "{ Role" "$file"; then
    sed -i 's/hasPermission, type Permission/hasPermission, type Permission, type Role/g' "$file"
  fi
done
