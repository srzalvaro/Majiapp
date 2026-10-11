-- Ejecutar DESPUÉS de crear los 3 usuarios en Authentication > Users
-- (con "Auto Confirm User" marcado). Cambia los emails por los que hayas usado.
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"padres"}'  where email = 'padres@maji.app';
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"abuelos"}' where email = 'abuelos@maji.app';
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"lucia"}'   where email = 'lucia@maji.app';

select email, raw_app_meta_data ->> 'rol' as rol from auth.users where email like '%@maji.app';
