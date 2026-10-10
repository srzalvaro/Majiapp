-- Ejecutar DESPUÉS de crear los 3 usuarios en Authentication > Users
-- (con "Auto Confirm User" marcado). Cambia los emails por los que hayas usado.
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"padres"}'  where email = 'padres@majiapp.app';
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"abuelos"}' where email = 'abuelos@majiapp.app';
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"lucia"}'   where email = 'lucia@majiapp.app';

select email, raw_app_meta_data ->> 'rol' as rol from auth.users where email like '%@majiapp.app';
